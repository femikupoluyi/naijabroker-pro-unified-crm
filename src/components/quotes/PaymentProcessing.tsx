import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, ArrowLeft, CheckCircle, Clock, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentProcessingProps {
  quoteId: string;
  clientData: any;
  evaluatedQuotes: any[];
  selectedQuote?: any;
  onBack: () => void;
  onPaymentComplete?: (paymentData: any) => void;
}

export const PaymentProcessing = ({ quoteId, clientData, evaluatedQuotes, selectedQuote, onBack, onPaymentComplete }: PaymentProcessingProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentTransaction, setPaymentTransaction] = useState<any>(null);
  const [paymentLink, setPaymentLink] = useState<string>('');

  useEffect(() => {
    loadPaymentStatus();
  }, [quoteId]);

  const loadPaymentStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPaymentTransaction(data);
      }
    } catch (error) {
      console.error('Error loading payment status:', error);
    }
  };

  const generatePaymentLink = async () => {
    if (!selectedQuote) {
      toast({
        title: "No Quote Selected",
        description: "Please select a quote first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create or update payment transaction
      const transactionData = {
        quote_id: quoteId,
        client_id: clientData.id,
        organization_id: clientData.organization_id,
        amount: selectedQuote.premium_quoted,
        currency: 'NGN',
        payment_method: 'pending_selection',
        status: 'pending',
        metadata: {
          selected_quote: selectedQuote,
          client_selection_confirmed: true,
          generated_at: new Date().toISOString()
        }
      };

      const { data: transaction, error } = await supabase
        .from('payment_transactions')
        .upsert(transactionData, { 
          onConflict: 'quote_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;

      // Generate payment link
      const { data: linkData, error: linkError } = await supabase.functions.invoke('generate-payment-link', {
        body: {
          paymentTransactionId: transaction.id,
          amount: selectedQuote.premium_quoted,
          currency: 'NGN',
          clientEmail: clientData.email,
          clientName: clientData.name
        }
      });

      if (linkError) throw linkError;

      setPaymentLink(linkData.paymentUrl || '');
      setPaymentTransaction(transaction);

      toast({
        title: "Payment Link Generated",
        description: "Payment link has been generated and can be sent to client"
      });

    } catch (error: any) {
      console.error('Error generating payment link:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate payment link",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'pending_verification': return 'bg-yellow-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending_verification': return <Clock className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Payment Processing</CardTitle>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Client:</strong> {clientData?.name}</div>
              <div><strong>Client ID:</strong> {clientData?.client_code}</div>
              <div><strong>Selected Insurer:</strong> {selectedQuote?.insurer_name || 'N/A'}</div>
              <div><strong>Total Premium:</strong> ₦{selectedQuote?.premium_quoted?.toLocaleString() || '0'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        {paymentTransaction && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Badge className={getStatusColor(paymentTransaction.status)}>
                  {getStatusIcon(paymentTransaction.status)}
                  <span className="ml-1">{paymentTransaction.status.replace('_', ' ').toUpperCase()}</span>
                </Badge>
                <span className="text-sm text-gray-600">
                  Updated: {new Date(paymentTransaction.updated_at).toLocaleString()}
                </span>
              </div>

              {paymentTransaction.status === 'pending_verification' && (
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    Bank transfer details submitted by client. Awaiting payment verification.
                  </p>
                </div>
              )}

              {paymentTransaction.status === 'completed' && (
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <p className="text-sm text-green-800">
                    Payment confirmed! Policy processing can begin.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generate Payment Link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Generate Payment Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Client:</strong> {clientData?.name}</div>
              <div><strong>Amount:</strong> ₦{selectedQuote?.premium_quoted?.toLocaleString() || '600,000'}</div>
              <div><strong>Client Email Address:</strong> {clientData?.email}</div>
            </div>

            {!paymentLink ? (
              <Button 
                onClick={generatePaymentLink} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Generating..." : "Generate & Send Payment Link"}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Payment Link Generated</span>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    Payment link has been generated and sent to the client's email address.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open Payment Link
                    </a>
                  </Button>
                </div>

                <Button 
                  onClick={generatePaymentLink} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? "Regenerating..." : "Regenerate Payment Link"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dynamic Status Updates */}
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">Payment Status Updates</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Payment status updates automatically as client completes payment</li>
            <li>• You'll be notified when bank transfer is submitted for verification</li>
            <li>• Gateway payments are processed immediately</li>
            <li>• Use the refresh button to check for status changes</li>
          </ul>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadPaymentStatus}
            className="mt-3"
          >
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};