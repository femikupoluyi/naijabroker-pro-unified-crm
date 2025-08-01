
import { supabase } from '@/integrations/supabase/client';
import { Quote, QuoteInsert, QuoteUpdate } from './types';

export interface QuoteWithClient extends Quote {
  client?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
}

export class QuoteService {
  static async getAll(): Promise<QuoteWithClient[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        client:clients(id, name, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getByOrganization(organizationId: string): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<QuoteWithClient | null> {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        client:clients(id, name, email, phone)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async create(quote: QuoteInsert): Promise<Quote> {
    const { data, error } = await supabase
      .from('quotes')
      .insert(quote)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: QuoteUpdate): Promise<Quote> {
    console.log(`🔄 QuoteService: Updating quote ${id} with:`, updates);
    
    const { data, error } = await supabase
      .from('quotes')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error(`❌ QuoteService: Failed to update quote ${id}:`, error);
      throw error;
    }
    
    console.log(`✅ QuoteService: Quote ${id} updated successfully:`, data);
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async updateStatus(id: string, status: string): Promise<Quote> {
    console.log(`🔄 QuoteService: Updating quote ${id} status to ${status}`);
    const result = await this.update(id, { 
      status: status as any,
      updated_at: new Date().toISOString()
    });
    console.log(`✅ QuoteService: Quote status updated successfully`);
    return result;
  }

  static async updateWorkflowStage(id: string, stage: string): Promise<Quote> {
    console.log(`🔄 QuoteService: Updating quote ${id} workflow stage to ${stage}`);
    const result = await this.update(id, { 
      workflow_stage: stage,
      updated_at: new Date().toISOString()
    });
    console.log(`✅ QuoteService: Workflow stage updated successfully`);
    return result;
  }

  static async updatePaymentStatus(id: string, paymentStatus: string): Promise<Quote> {
    console.log(`🔄 QuoteService: Updating quote ${id} payment status to ${paymentStatus}`);
    const result = await this.update(id, { 
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    });
    console.log(`✅ QuoteService: Payment status updated successfully`);
    return result;
  }

  static async updateWorkflowData(id: string, updates: { 
    workflow_stage?: string; 
    status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'; 
    payment_status?: string; 
  }): Promise<Quote> {
    console.log(`🔄 QuoteService: Batch updating quote ${id} workflow data:`, updates);
    const result = await this.update(id, { 
      ...updates,
      updated_at: new Date().toISOString()
    });
    console.log(`✅ QuoteService: Batch workflow update completed successfully`);
    return result;
  }

  static async convertToPolicy(id: string, policyId: string): Promise<Quote> {
    console.log(`🔄 QuoteService: Converting quote ${id} to policy ${policyId}`);
    
    try {
      const result = await this.update(id, { 
        status: 'accepted',
        converted_to_policy: policyId,
        workflow_stage: 'converted',
        updated_at: new Date().toISOString()
      });
      
      console.log(`✅ QuoteService: Quote ${id} successfully converted to policy ${policyId}`);
      return result;
    } catch (error) {
      console.error(`❌ QuoteService: Failed to convert quote ${id} to policy:`, error);
      throw new Error(`Failed to convert quote to policy: ${error.message}`);
    }
  }

  static async getFinalizedQuotesForPolicy(organizationId: string): Promise<Quote[]> {
    console.log(`🔍 QuoteService: Fetching finalized quotes for organization ${organizationId}`);
    
    // First, ensure all completed quotes have their evaluated data synced
    await this.syncCompletedQuotesData(organizationId);
    
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('organization_id', organizationId)
      .not('final_contract_url', 'is', null)
      .eq('workflow_stage', 'completed')
      .is('converted_to_policy', null)
      .gt('premium', 0) // Ensure premium is greater than 0
      .gt('sum_insured', 0) // Ensure sum_insured is greater than 0
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ QuoteService: Failed to fetch finalized quotes:', error);
      throw error;
    }
    
    const validQuotes = (data || []).filter(quote => {
      // Additional validation to ensure data integrity
      const isValid = quote.premium > 0 && 
                     quote.sum_insured > 0 && 
                     quote.underwriter && 
                     quote.underwriter !== 'TBD' &&
                     quote.client_name;
      
      if (!isValid) {
        console.warn(`⚠️ QuoteService: Skipping invalid quote ${quote.quote_number}:`, {
          premium: quote.premium,
          sum_insured: quote.sum_insured,
          underwriter: quote.underwriter,
          client_name: quote.client_name
        });
      }
      
      return isValid;
    });
    
    console.log(`✅ QuoteService: Found ${validQuotes.length} valid finalized quotes ready for policy conversion`);
    return validQuotes;
  }

  /**
   * Sync completed quotes data from evaluated_quotes to main quotes table
   */
  static async syncCompletedQuotesData(organizationId: string): Promise<void> {
    try {
      console.log(`🔄 QuoteService: Syncing completed quotes data for organization ${organizationId}`);

      // Get all completed quotes that still have zero premium
      const { data: completedQuotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id, quote_number, premium, underwriter')
        .eq('organization_id', organizationId)
        .eq('workflow_stage', 'completed')
        .or('premium.eq.0,underwriter.eq.TBD');

      if (quotesError || !completedQuotes) {
        console.log('No completed quotes need syncing');
        return;
      }

      console.log(`Found ${completedQuotes.length} completed quotes that need data syncing`);

      // Process each quote
      for (const quote of completedQuotes) {
        // Get the best evaluated quote for this quote
        const { data: evaluatedQuotes, error: evalError } = await supabase
          .from('evaluated_quotes')
          .select('*')
          .eq('quote_id', quote.id)
          .eq('response_received', true)
          .order('rating_score', { ascending: false })
          .limit(1);

        if (evalError || !evaluatedQuotes || evaluatedQuotes.length === 0) {
          console.log(`No evaluated quotes found for quote ${quote.quote_number}`);
          continue;
        }

        const selectedQuote = evaluatedQuotes[0];
        
        // Update the main quotes table
        const { error: updateError } = await supabase
          .from('quotes')
          .update({
            premium: selectedQuote.premium_quoted,
            underwriter: selectedQuote.insurer_name,
            commission_rate: selectedQuote.commission_split,
            terms_conditions: selectedQuote.terms_conditions || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', quote.id);

        if (updateError) {
          console.error(`❌ Failed to sync quote ${quote.quote_number}:`, updateError);
        } else {
          console.log(`✅ Synced quote ${quote.quote_number} with premium ₦${selectedQuote.premium_quoted.toLocaleString()}`);
        }
      }
    } catch (error) {
      console.error('❌ Error syncing completed quotes data:', error);
    }
  }

  static async getExpiringQuotes(daysAhead = 7): Promise<Quote[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .lte('valid_until', futureDate.toISOString().split('T')[0])
      .eq('status', 'sent')
      .order('valid_until', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getByWorkflowStage(stage: string): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('workflow_stage', stage)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
