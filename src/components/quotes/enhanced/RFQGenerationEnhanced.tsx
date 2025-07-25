
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Eye } from "lucide-react";

interface RFQGenerationEnhancedProps {
  quoteData: any;
  clauses: any[] | { clauses: any[], addOns: any[] } | any;
  onRFQGenerated: (rfqData: any) => void;
  onBack: () => void;
}

export const RFQGenerationEnhanced = ({ quoteData, clauses, onRFQGenerated, onBack }: RFQGenerationEnhancedProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rfqContent, setRfqContent] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const generateRFQContent = () => {
    if (!quoteData) return '';

    console.log('DEBUG: RFQ Generation - clauses data:', clauses);
    console.log('DEBUG: RFQ Generation - clause data type:', typeof clauses);
    console.log('DEBUG: RFQ Generation - clauses length:', clauses?.length);

    // Handle both clause-only data and the new {clauses, addOns} structure
    let clausesList = [];
    let addOnsList = [];
    
    if (clauses) {
      if (Array.isArray(clauses)) {
        // Old format - just clauses array
        clausesList = clauses;
      } else if (clauses.clauses || clauses.addOns) {
        // New format - {clauses: [], addOns: []}
        clausesList = clauses.clauses || [];
        addOnsList = clauses.addOns || [];
      }
    }

    console.log('DEBUG: RFQ Generation - processed clausesList:', clausesList);
    console.log('DEBUG: RFQ Generation - processed addOnsList:', addOnsList);

    return `REQUEST FOR QUOTATION

Client Information:
- Name: ${quoteData.client_name || 'N/A'}
- Email: ${quoteData.client_email || 'N/A'}
- Phone: ${quoteData.client_phone || 'N/A'}

Insurance Details:
- Class of Insurance: ${quoteData.policy_type || 'N/A'}
- Sum Insured: ₦${quoteData.sum_insured?.toLocaleString() || '0'}
- Premium: ₦${quoteData.premium?.toLocaleString() || '0'}
- Commission Rate: ${quoteData.commission_rate || '0'}%

Insured Item Details:
- Item/Asset: ${quoteData.insured_item || 'N/A'}
- Location: ${quoteData.location || 'N/A'}
- Description: ${quoteData.insured_description || 'N/A'}
- Risk Assessment: ${quoteData.risk_details || 'N/A'}
- Coverage Requirements: ${quoteData.coverage_requirements || 'N/A'}

Terms & Conditions:
${quoteData.terms_conditions || 'Standard terms and conditions apply.'}

${(clausesList.length > 0 || addOnsList.length > 0) ? `
Selected Clauses and Add-ons:
${clausesList.map((clause, index) => {
  const name = clause.custom_name || clause.name || 'Unknown Clause';
  const category = clause.category || 'N/A';
  const premiumImpact = clause.premium_impact_value && clause.premium_impact_value !== 0 
    ? ` (${clause.premium_impact_value > 0 ? '+' : ''}${clause.premium_impact_value}% premium impact)` 
    : '';
  return `${index + 1}. ${name} [${category}]${premiumImpact}`;
}).join('\n')}${addOnsList.length > 0 ? `
${addOnsList.map((addOn, index) => {
  const name = addOn.custom_name || addOn.name || 'Unknown Add-on';
  const premiumImpact = addOn.premium_impact_value && addOn.premium_impact_value !== 0 
    ? ` (${addOn.premium_impact_value > 0 ? '+' : ''}${addOn.premium_impact_value}% premium impact)` 
    : '';
  return `${clausesList.length + index + 1}. ${name} [Add-on]${premiumImpact}`;
}).join('\n')}` : ''}
` : ''}

Validity: ${quoteData.valid_until || 'N/A'}

Please provide your best quotation for the above requirements.

${additionalNotes ? `Additional Notes:\n${additionalNotes}` : ''}
`;
  };

  const handleGenerateRFQ = () => {
    setLoading(true);
    
    try {
      const content = generateRFQContent();
      setRfqContent(content);
      
      toast({
        title: "Success",
        description: "RFQ document generated successfully",
      });
    } catch (error) {
      console.error('Error generating RFQ:', error);
      toast({
        title: "Error",
        description: "Failed to generate RFQ document",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadRFQ = () => {
    if (!rfqContent) return;
    
    const blob = new Blob([rfqContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RFQ_${quoteData?.quote_number || 'Quote'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleContinue = async () => {
    if (!rfqContent) {
      toast({
        title: "Error",
        description: "Please generate RFQ document first",
        variant: "destructive"
      });
      return;
    }

    // Update quote status and workflow stage
    if (quoteData?.id) {
      try {
        const { WorkflowStatusService } = await import('@/services/workflowStatusService');
        await WorkflowStatusService.updateQuoteWorkflowStage(quoteData.id, {
          stage: 'rfq-generation',
          status: 'sent',
          additionalData: { rfq_document_url: rfqContent }
        });
      } catch (error) {
        console.error('Failed to update quote status:', error);
      }
    }

    const rfqData = {
      content: rfqContent,
      generated_at: new Date().toISOString(),
      quote_id: quoteData?.id,
      additional_notes: additionalNotes,
      // Include all quote data for email generation
      quote_number: quoteData?.quote_number,
      client_name: quoteData?.client_name,
      policy_type: quoteData?.policy_type,
      sum_insured: quoteData?.sum_insured,
      premium: quoteData?.premium,
      start_date: quoteData?.start_date,
      end_date: quoteData?.end_date,
      valid_until: quoteData?.valid_until,
      location: quoteData?.location,
      risk_details: quoteData?.risk_details,
    };

    console.log('DEBUG: RFQ Generation - rfqData being passed:', rfqData);
    console.log('DEBUG: RFQ Generation - rfqContent:', rfqContent);

    onRFQGenerated(rfqData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          RFQ Generation
        </CardTitle>
        <p className="text-sm text-gray-600">
          Generate Request for Quotation document for {quoteData?.client_name || 'client'}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quote Summary */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Quote Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="space-y-2 text-sm">
              <div><strong>Quote #:</strong> {quoteData?.quote_number || 'N/A'}</div>
              <div><strong>Client:</strong> {quoteData?.client_name || 'N/A'}</div>
              <div><strong>Insurance Type:</strong> {quoteData?.policy_type || 'N/A'}</div>
              <div><strong>Sum Insured:</strong> ₦{quoteData?.sum_insured?.toLocaleString() || '0'}</div>
              <div><strong>Premium:</strong> ₦{quoteData?.premium?.toLocaleString() || '0'}</div>
              <div><strong>Valid Until:</strong> {quoteData?.valid_until || 'N/A'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="additional_notes">Additional Notes for RFQ</Label>
          <Textarea
            id="additional_notes"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Add any additional instructions or requirements for insurers..."
            rows={3}
          />
        </div>

        {/* Generate RFQ Button */}
        <div className="flex gap-4">
          <Button onClick={handleGenerateRFQ} disabled={loading}>
            {loading ? "Generating..." : "Generate RFQ Document"}
          </Button>
          
          {rfqContent && (
            <>
              <Button variant="outline" onClick={handleDownloadRFQ}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </>
          )}
        </div>

        {/* RFQ Preview */}
        {rfqContent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                RFQ Document Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-4 rounded border max-h-96 overflow-y-auto">
                {rfqContent}
              </pre>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleContinue} disabled={!rfqContent}>
            Continue to Insurer Matching
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
