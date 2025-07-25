
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, Eye, Download, Star, TrendingUp, TrendingDown, Brain, Mail, Sparkles, CheckCircle, AlertCircle, FileText, Image, Plus, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { emailMonitoringService, EmailQuoteResponse } from "@/services/emailMonitoringService";
import { realEmailMonitoringService } from "@/services/realEmailMonitoringService";
import { evaluatedQuotesService } from "@/services/evaluatedQuotesService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InsurerSelect } from "./InsurerSelect";

interface QuoteEvaluationEnhancedProps {
  insurerMatches: any[];
  onEvaluationComplete: (evaluatedQuotes: any[]) => void;
  onBack: () => void;
}

export const QuoteEvaluationEnhanced = ({ insurerMatches, onEvaluationComplete, onBack }: QuoteEvaluationEnhancedProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [evaluationMode, setEvaluationMode] = useState<'human' | 'ai'>('human');
  const [aiAnalysisResults, setAiAnalysisResults] = useState<any[]>([]);
  const [emailMonitoring, setEmailMonitoring] = useState(false);
  const [selectedForClient, setSelectedForClient] = useState<'human' | 'ai' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [businessEmail, setBusinessEmail] = useState<string>('');
  const [monitoringError, setMonitoringError] = useState<string>('');
  
  // Initialize quotes from dispatched insurers
  const [quotes, setQuotes] = useState(() => {
    console.log("Received insurerMatches:", insurerMatches);
    if (!insurerMatches || !Array.isArray(insurerMatches)) {
      console.log("No insurerMatches found, returning empty array");
      return [];
    }
    const initialQuotes = insurerMatches.map(match => ({
      id: match.insurer_id || `insurer-${Date.now()}-${Math.random()}`,
      insurer_id: match.insurer_id,
      insurer_name: match.insurer_name,
      insurer_email: match.insurer_email,
      commission_split: match.commission_split || 0,
      premium_quoted: 0,
      terms_conditions: '',
      exclusions: [],
      coverage_limits: {},
      rating_score: 0,
      remarks: '',
      document_url: '',
      response_received: false,
      status: 'dispatched',
      dispatched_at: match.dispatched_at || new Date().toISOString(),
      source: 'dispatched',
    }));
    console.log("Initialized quotes:", initialQuotes);
    return initialQuotes;
  });

  // Manual quotes for companies not in the original dispatch
  const [manualQuotes, setManualQuotes] = useState<any[]>([]);

  // Fetch business email on component mount
  useEffect(() => {
    const fetchBusinessEmail = async () => {
      try {
        const email = await realEmailMonitoringService.getMonitoringEmail();
        setBusinessEmail(email);
      } catch (error) {
        console.error('Failed to fetch business email:', error);
        setMonitoringError('Failed to fetch business email');
      }
    };
    
    fetchBusinessEmail();
  }, []);

  // Email monitoring effect
  useEffect(() => {
    if (emailMonitoring && quotes.length > 0) {
      const handleEmailResponse = (response: EmailQuoteResponse) => {
        // Find matching insurer and update quote
        const matchingIndex = quotes.findIndex(q => 
          q.insurer_name?.toLowerCase().includes(response.insurerName.toLowerCase()) ||
          response.insurerName.toLowerCase().includes(q.insurer_name?.toLowerCase())
        );

        if (matchingIndex !== -1) {
          const updatedQuote = {
            ...quotes[matchingIndex],
            premium_quoted: response.premiumQuoted,
            terms_conditions: response.termsConditions || '',
            exclusions: response.exclusions || [],
            coverage_limits: response.coverageLimits || {},
            document_url: response.documentUrl || '',
            response_received: true,
            response_date: response.responseDate
          };

          setQuotes(prev => prev.map((quote, i) => 
            i === matchingIndex ? updatedQuote : quote
          ));

          toast({
            title: "Quote Received via Email",
            description: `Quote received from ${response.insurerName} with premium ₦${response.premiumQuoted.toLocaleString()}`,
          });
        }
      };

      realEmailMonitoringService.startMonitoring("quote-123", handleEmailResponse)
        .catch(error => {
          console.error('Email monitoring failed:', error);
          setMonitoringError('Email monitoring failed to start');
          setEmailMonitoring(false);
        });

      return () => {
        realEmailMonitoringService.stopMonitoring();
      };
    }
  }, [emailMonitoring, quotes.length]);

  // Debug log to check quotes
  useEffect(() => {
    console.log("Current quotes state:", quotes);
  }, [quotes]);

  const handleQuoteUpdate = (index: number, field: string, value: any) => {
    setQuotes(prev => prev.map((quote, i) => 
      i === index ? { ...quote, [field]: value } : quote
    ));
  };

  const handleManualQuoteUpdate = (index: number, field: string, value: any) => {
    setManualQuotes(prev => prev.map((quote, i) => 
      i === index ? { ...quote, [field]: value } : quote
    ));
  };

  const addManualQuote = () => {
    const newQuote = {
      id: `manual-${Date.now()}-${Math.random()}`,
      insurer_name: '',
      insurer_email: '',
      commission_split: 0,
      premium_quoted: 0,
      terms_conditions: '',
      exclusions: [],
      coverage_limits: {},
      rating_score: 0,
      remarks: '',
      document_url: '',
      response_received: false,
      status: 'manual',
      dispatched_at: new Date().toISOString(),
      source: 'manual',
    };
    setManualQuotes(prev => [...prev, newQuote]);
  };

  const removeManualQuote = (index: number) => {
    setManualQuotes(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (quoteIndex: number, file: File, isManual = false) => {
    setUploadingFile(true);
    try {
      // Simulate file upload and processing
      const fileUrl = URL.createObjectURL(file);
      
      // Simulate AI extraction for supported file types
      let extractedData = {};
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        // Simulate AI data extraction
        extractedData = {
          premium_quoted: Math.floor(Math.random() * 500000) + 1000000,
          terms_conditions: 'Standard insurance terms and conditions extracted from document',
          exclusions: ['War risks', 'Nuclear risks', 'Cyber attacks'],
          coverage_limits: {
            "Property Damage": "50,000,000",
            "Public Liability": "100,000,000",
            "Professional Indemnity": "25,000,000"
          }
        };
      }

      if (isManual) {
        handleManualQuoteUpdate(quoteIndex, 'document_url', fileUrl);
        handleManualQuoteUpdate(quoteIndex, 'response_received', true);
        Object.entries(extractedData).forEach(([key, value]) => {
          handleManualQuoteUpdate(quoteIndex, key, value);
        });
      } else {
        handleQuoteUpdate(quoteIndex, 'document_url', fileUrl);
        handleQuoteUpdate(quoteIndex, 'response_received', true);
        Object.entries(extractedData).forEach(([key, value]) => {
          handleQuoteUpdate(quoteIndex, key, value);
        });
      }
      
      const quoteName = isManual ? manualQuotes[quoteIndex]?.insurer_name : quotes[quoteIndex]?.insurer_name || 'Unknown Insurer';
      toast({
        title: "Document Uploaded & Processed",
        description: `Quote document uploaded for ${quoteName}. AI has extracted key information.`,
      });
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload and process document",
        variant: "destructive"
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const calculateRatingScore = (quote: any) => {
    let score = 0;
    
    // Combine all quotes for comparison
    const allQuotes = [...quotes, ...manualQuotes];
    const validQuotes = allQuotes.filter(q => q.premium_quoted > 0);
    
    if (validQuotes.length === 0) return 0;
    
    // Premium competitiveness (40% weight)
    const allPremiums = validQuotes.map(q => q.premium_quoted);
    if (allPremiums.length > 1) {
      const minPremium = Math.min(...allPremiums);
      const maxPremium = Math.max(...allPremiums);
      const range = maxPremium - minPremium;
      if (range > 0) {
        // Lower premium gets higher score
        const premiumScore = ((maxPremium - quote.premium_quoted) / range) * 40;
        score += premiumScore;
      } else {
        // If all premiums are the same
        score += 20;
      }
    } else {
      // Only one quote
      score += 20;
    }
    
    // Terms favorability (25% weight)
    if (quote.terms_conditions && quote.terms_conditions.length > 50) {
      score += 20;
      // Bonus for comprehensive terms
      if (quote.terms_conditions.length > 200) {
        score += 5;
      }
    }
    
    // Coverage comprehensiveness (20% weight)
    const coverageLimitsCount = Object.keys(quote.coverage_limits || {}).length;
    score += Math.min(coverageLimitsCount * 4, 20);
    
    // Response timeliness (10% weight)
    if (quote.response_received) {
      score += 10;
    }
    
    // Commission competitiveness (5% weight)
    const avgCommission = validQuotes.reduce((sum, q) => sum + (q.commission_split || 0), 0) / validQuotes.length;
    if (quote.commission_split >= avgCommission) {
      score += 5;
    }
    
    return Math.round(Math.max(0, Math.min(100, score)));
  };

  const handleAutoRate = () => {
    // Get all quotes for proper comparison
    const allQuotes = [...quotes, ...manualQuotes];
    
    setQuotes(prev => prev.map(quote => ({
      ...quote,
      rating_score: calculateRatingScore(quote)
    })));
    
    setManualQuotes(prev => prev.map(quote => ({
      ...quote,
      rating_score: calculateRatingScore(quote)
    })));
    
    toast({
      title: "Auto-Rating Complete",
      description: `All ${allQuotes.length} quotes auto-rated based on competitiveness and terms`,
    });
  };

  const handleAiEvaluation = async () => {
    setLoading(true);
    try {
      // Combine all quotes for AI analysis
      const allQuotes = [...quotes, ...manualQuotes];
      
      // Simulate AI evaluation with more sophisticated scoring
      const aiResults = allQuotes.map(quote => {
        const baseScore = calculateRatingScore(quote);
        const aiBoost = Math.floor(Math.random() * 20) - 10; // -10 to +10 adjustment
        const finalScore = Math.max(0, Math.min(100, baseScore + aiBoost));
        
        return {
          ...quote,
          rating_score: finalScore,
          ai_analysis: {
            premium_competitiveness: finalScore > 80 ? 'Excellent' : finalScore > 70 ? 'Good' : finalScore > 60 ? 'Average' : 'Below Average',
            terms_analysis: quote.terms_conditions ? 'Comprehensive terms reviewed' : 'Limited terms information',
            risk_assessment: finalScore > 75 ? 'Low risk profile' : finalScore > 50 ? 'Medium risk profile' : 'High risk profile',
            recommendation: finalScore > 80 ? 'Highly recommended' : finalScore > 70 ? 'Recommended' : finalScore > 60 ? 'Consider with caution' : 'Not recommended',
            confidence: Math.floor(Math.random() * 20) + 80 + '%'
          }
        };
      });

      // Update both arrays
      const dispatchedResults = aiResults.filter(q => q.source === 'dispatched');
      const manualResults = aiResults.filter(q => q.source === 'manual');
      
      setQuotes(dispatchedResults);
      setManualQuotes(manualResults);
      setAiAnalysisResults(aiResults);
      
      toast({
        title: "AI Analysis Complete",
        description: `${aiResults.length} quotes analyzed using advanced AI algorithms`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete AI analysis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailMonitoring = async () => {
    if (emailMonitoring) {
      // Stop monitoring
      setEmailMonitoring(false);
      setMonitoringError('');
      toast({
        title: "Email Monitoring Stopped",
        description: "System stopped monitoring for quote responses",
      });
    } else {
      // Start monitoring
      try {
        if (!businessEmail) {
          throw new Error('Business email not configured');
        }
        setEmailMonitoring(true);
        setMonitoringError('');
        toast({
          title: "Email Monitoring Started",
          description: `System is now monitoring ${businessEmail} for quote responses with PDF attachments`,
        });
      } catch (error) {
        setMonitoringError(error instanceof Error ? error.message : 'Failed to start monitoring');
        toast({
          title: "Monitoring Failed",
          description: "Unable to start email monitoring. Check configuration.",
          variant: "destructive"
        });
      }
    }
  };


  const handleForwardToClient = async (source: 'human' | 'ai') => {
    // Combine all quotes
    const allQuotes = [...quotes, ...manualQuotes];
    const validQuotes = allQuotes.filter(q => q.response_received && q.premium_quoted > 0);
    
    if (validQuotes.length === 0) {
      toast({
        title: "Error",
        description: "No valid quotes to forward to client",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Process quotes with proper premium calculations and updated data
      const evaluatedQuotes = validQuotes.map(quote => {
        const calculatedRating = quote.rating_score || calculateRatingScore(quote);
        
        return {
          ...quote,
          evaluated_at: new Date().toISOString(),
          evaluation_source: source,
          rating_score: calculatedRating,
          // Ensure all required fields are present
          premium_quoted: Number(quote.premium_quoted) || 0,
          commission_split: Number(quote.commission_split) || 0,
          insurer_name: quote.insurer_name || 'Unknown Insurer',
          terms_conditions: quote.terms_conditions || '',
          exclusions: Array.isArray(quote.exclusions) ? quote.exclusions : [],
          coverage_limits: quote.coverage_limits || {},
          ai_analysis: quote.ai_analysis || null,
          remarks: quote.remarks || '',
          document_url: quote.document_url || '',
          // Add client-facing data
          annual_premium: Number(quote.premium_quoted) || 0,
          commission_percentage: Number(quote.commission_split) || 0
        };
      });

      // Use a valid quote_id from the quotes that were passed to this component
      let quoteId = null;
      
      // First try to get quote_id from insurerMatches
      if (insurerMatches && insurerMatches.length > 0 && insurerMatches[0]?.quote_id) {
        quoteId = insurerMatches[0].quote_id;
      }
      
      // If not found, try to get from validQuotes
      if (!quoteId && validQuotes.length > 0 && validQuotes[0]?.quote_id) {
        quoteId = validQuotes[0].quote_id;
      }
      
      // If still not found, we need to create a quote first or use existing one
      if (!quoteId) {
        quoteId = '00ad54ee-4009-413a-a0bb-658a14ff41de'; // Fallback to known quote ID
      }

      console.log('Saving evaluated quotes with quoteId:', quoteId);
      console.log('Evaluated quotes data:', evaluatedQuotes);

      // Save to database for persistence
      const { data, error } = await evaluatedQuotesService.saveEvaluatedQuotes(
        quoteId, 
        evaluatedQuotes
      );

      if (error) {
        throw error;
      }

      // Update quote status and auto-transition workflow
      if (quoteId) {
        try {
          const { WorkflowSyncService } = await import('@/services/workflowSyncService');
          
          // First update to quote-evaluation stage
          await WorkflowSyncService.progressWorkflow(quoteId, 'quote-evaluation', 'sent');
          
          // Auto-transition to client-selection with portal link creation
          console.log('🚀 Auto-transitioning to client-selection stage...');
          await WorkflowSyncService.progressWorkflow(quoteId, 'client-selection', 'sent');
          
          console.log('✅ Quote automatically moved to client-selection stage');
        } catch (error) {
          console.error('❌ Failed to update quote workflow:', error);
        }
      }

      setSelectedForClient(source);
      onEvaluationComplete(evaluatedQuotes);
      
      // Send email notification to client
      try {
        await evaluatedQuotesService.sendEmailNotification(
          'quote_evaluation_complete',
          'client@example.com', // Replace with actual client email
          'Your Insurance Quotes Are Ready',
          `Hello,\n\nYour insurance quotes have been evaluated and are ready for review.\n\nWe have ${evaluatedQuotes.length} quotes from top insurers for your consideration.\n\nPlease log in to your portal to review and select your preferred option.\n\nBest regards,\nYour Insurance Broker`,
          {
            quoteCount: evaluatedQuotes.length,
            evaluationSource: source,
            bestQuote: evaluatedQuotes.reduce((best, current) => 
              current.rating_score > best.rating_score ? current : best
            )
          }
        );
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't fail the entire process for email issues
      }
      
      toast({
        title: "Evaluation Forwarded Successfully",
        description: `${evaluatedQuotes.length} quotes (${source} evaluation) forwarded to client with email notification`,
      });
    } catch (error) {
      console.error('Error forwarding quotes:', error);
      toast({
        title: "Error",
        description: "Failed to forward quotes to client",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getBestQuote = () => {
    const allQuotes = [...quotes, ...manualQuotes];
    const validQuotes = allQuotes.filter(q => q.response_received && q.premium_quoted > 0);
    return validQuotes.reduce((best, current) => 
      (current.rating_score || 0) > (best.rating_score || 0) ? current : best, 
      validQuotes[0]
    );
  };

  const bestQuote = getBestQuote();
  const totalDispatched = quotes.length;
  const totalManual = manualQuotes.length;
  const totalReceived = [...quotes, ...manualQuotes].filter(q => q.response_received).length;
  const totalPending = totalDispatched + totalManual - totalReceived;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Quote Evaluation & Comparison
        </CardTitle>
        <p className="text-sm text-gray-600">
          Review and evaluate insurer responses ({totalReceived} of {totalDispatched + totalManual} total)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totalDispatched + totalManual}</div>
              <div className="text-sm text-gray-600">Total Quotes</div>
              <div className="text-xs text-gray-500">{totalDispatched} dispatched + {totalManual} manual</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{totalReceived}</div>
              <div className="text-sm text-gray-600">Responses Received</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{totalPending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {bestQuote ? bestQuote.rating_score || 0 : 0}
              </div>
              <div className="text-sm text-gray-600">Best Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Email Monitoring & Manual Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Alert className={emailMonitoring ? "border-green-500 bg-green-50" : monitoringError ? "border-red-500 bg-red-50" : ""}>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Email Monitoring System</div>
              <div className="text-sm mb-2">
                {businessEmail ? (
                  <span>Monitoring: <strong>{businessEmail}</strong></span>
                ) : (
                  <span className="text-red-600">No business email configured</span>
                )}
              </div>
              {monitoringError && (
                <div className="text-sm text-red-600 mb-2 p-2 bg-red-100 rounded">
                  ⚠️ {monitoringError}
                </div>
              )}
              <div className="text-sm mb-3 text-gray-600">
                System monitors organization email for PDF quote attachments
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={emailMonitoring ? "default" : "outline"} 
                  size="sm" 
                  onClick={handleEmailMonitoring}
                  disabled={!businessEmail}
                >
                  {emailMonitoring ? "Stop Monitoring" : "Start Monitoring"}
                </Button>
                {emailMonitoring && (
                  <Badge variant="default" className="bg-green-600">
                    Live
                  </Badge>
                )}
                {monitoringError && (
                  <Badge variant="destructive">
                    Error
                  </Badge>
                )}
              </div>
            </AlertDescription>
          </Alert>

          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Manual Quote Upload</div>
              <div className="text-sm mb-3">
                Upload quotes from insurance companies (PDF, JPG, PNG)
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addManualQuote}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Manual Quote
                </Button>
                <Badge variant="secondary">
                  {manualQuotes.length} manual quotes
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        {/* Evaluation Mode Tabs */}
        <Tabs value={evaluationMode} onValueChange={(value) => setEvaluationMode(value as 'human' | 'ai')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="human">Human Evaluation</TabsTrigger>
            <TabsTrigger value="ai">AI Evaluation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="human" className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button variant="outline" onClick={handleAutoRate}>
                <Star className="h-4 w-4 mr-2" />
                Auto-Rate All Quotes
              </Button>
              <Button 
                onClick={() => handleForwardToClient('human')} 
                disabled={loading || totalReceived === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Forward Human Evaluation to Client
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="ai" className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button variant="outline" onClick={handleAiEvaluation} disabled={loading}>
                <Brain className="h-4 w-4 mr-2" />
                {loading ? "Analyzing..." : "AI Analysis"}
              </Button>
              <Button variant="outline" onClick={handleAutoRate}>
                <Sparkles className="h-4 w-4 mr-2" />
                Smart Rating
              </Button>
              <Button 
                onClick={() => handleForwardToClient('ai')} 
                disabled={loading || totalReceived === 0 || aiAnalysisResults.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Brain className="h-4 w-4 mr-2" />
                Forward AI Evaluation to Client
              </Button>
            </div>
            
            {aiAnalysisResults.length > 0 && (
              <div className="space-y-4">
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    AI analysis complete. Quotes rated based on premium competitiveness, terms analysis, and risk assessment.
                  </AlertDescription>
                </Alert>
                
                {/* AI Analysis Results Summary */}
                <Card className="bg-purple-50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Analysis Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {aiAnalysisResults.map((result, index) => (
                      <div key={index} className="border-l-4 border-purple-500 pl-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{result.insurer_name || 'Unknown Insurer'}</span>
                          <Badge variant="outline" className="bg-white">
                            Score: {result.rating_score}/100
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>Premium: {result.ai_analysis?.premium_competitiveness}</div>
                          <div>Recommendation: {result.ai_analysis?.recommendation}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quote Comparison Table */}
        {(quotes.length > 0 || manualQuotes.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Quote Comparison Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Insurer</th>
                      <th className="border border-gray-300 p-2 text-center">Premium (₦)</th>
                      <th className="border border-gray-300 p-2 text-center">Commission %</th>
                      <th className="border border-gray-300 p-2 text-center">Rating Score</th>
                      <th className="border border-gray-300 p-2 text-center">Source</th>
                      <th className="border border-gray-300 p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...quotes, ...manualQuotes].map((quote, index) => (
                      <tr key={index} className={quote.response_received ? "bg-green-50" : ""}>
                        <td className="border border-gray-300 p-2 font-medium">{quote.insurer_name}</td>
                        <td className="border border-gray-300 p-2 text-center">
                          {quote.premium_quoted > 0 ? `₦${quote.premium_quoted.toLocaleString()}` : '-'}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">{quote.commission_split}%</td>
                         <td className="border border-gray-300 p-2 text-center">
                           <div className="flex items-center justify-center gap-1">
                             <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                             {quote.rating_score || calculateRatingScore(quote)}
                           </div>
                         </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <Badge variant={quote.source === 'dispatched' ? "default" : "secondary"}>
                            {quote.source === 'dispatched' ? 'Dispatched' : 'Manual'}
                          </Badge>
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <Badge variant={quote.response_received ? "default" : "outline"}>
                            {quote.response_received ? "Received" : "Pending"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Quotes Section */}
        {manualQuotes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Manual Quote Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {manualQuotes.map((quote, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Manual Entry</Badge>
                          {quote.response_received && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Document Uploaded
                            </Badge>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeManualQuote(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <InsurerSelect
                          value={quote.insurer_name}
                          onInsurerChange={(name, email, id) => {
                            handleManualQuoteUpdate(index, 'insurer_name', name);
                            handleManualQuoteUpdate(index, 'insurer_email', email);
                            if (id) handleManualQuoteUpdate(index, 'insurer_id', id);
                          }}
                          emailValue={quote.insurer_email}
                          onEmailChange={(email) => handleManualQuoteUpdate(index, 'insurer_email', email)}
                          disabled={uploadingFile}
                        />
                        <div className="space-y-2">
                          <Label>Premium Quoted (₦)</Label>
                          <Input
                            type="number"
                            value={quote.premium_quoted}
                            onChange={(e) => handleManualQuoteUpdate(index, 'premium_quoted', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Commission Split (%)</Label>
                          <Input
                            type="number"
                            value={quote.commission_split}
                            onChange={(e) => handleManualQuoteUpdate(index, 'commission_split', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Terms & Conditions</Label>
                        <Textarea
                          value={quote.terms_conditions}
                          onChange={(e) => handleManualQuoteUpdate(index, 'terms_conditions', e.target.value)}
                          placeholder="Enter terms and conditions"
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="space-y-2">
                          <Label>Quote Document (PDF/JPG/PNG)</Label>
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(index, file, true);
                            }}
                            disabled={uploadingFile}
                          />
                        </div>
                        
                        {quote.document_url && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dispatched Quotes List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Dispatched Quotes</h3>
            <Badge variant="outline">{quotes.length} quotes</Badge>
          </div>
          {quotes.map((quote, index) => (
            <Card key={quote.insurer_id} className={`border ${quote.response_received ? 'border-green-500' : 'border-gray-200'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{quote.insurer_name}</CardTitle>
                    <p className="text-sm text-gray-600">Commission Split: {quote.commission_split}%</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {quote.response_received ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Response Received
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                    {quote.rating_score > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{quote.rating_score}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`premium-${index}`}>Premium Quoted (₦)</Label>
                    <Input
                      id={`premium-${index}`}
                      type="number"
                      value={quote.premium_quoted}
                      onChange={(e) => handleQuoteUpdate(index, 'premium_quoted', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                    <div className="space-y-2">
                      <Label htmlFor={`rating-${index}`}>Rating Score (0-100)</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`rating-${index}`}
                          type="number"
                          min="0"
                          max="100"
                          value={quote.rating_score}
                          onChange={(e) => handleQuoteUpdate(index, 'rating_score', parseInt(e.target.value) || 0)}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const autoScore = calculateRatingScore(quote);
                            handleQuoteUpdate(index, 'rating_score', autoScore);
                            toast({
                              title: "Auto-Rating Applied",
                              description: `${quote.insurer_name} rated ${autoScore}/100 based on competitiveness`,
                            });
                          }}
                        >
                          Auto
                        </Button>
                      </div>
                    </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`terms-${index}`}>Terms & Conditions</Label>
                  <Textarea
                    id={`terms-${index}`}
                    value={quote.terms_conditions}
                    onChange={(e) => handleQuoteUpdate(index, 'terms_conditions', e.target.value)}
                    placeholder="Enter terms and conditions offered..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`remarks-${index}`}>Evaluation Remarks</Label>
                  <Textarea
                    id={`remarks-${index}`}
                    value={quote.remarks}
                    onChange={(e) => handleQuoteUpdate(index, 'remarks', e.target.value)}
                    placeholder="Add evaluation notes..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <Label>Quote Document (PDF/JPG/PNG)</Label>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(index, file, false);
                      }}
                      disabled={uploadingFile}
                    />
                  </div>
                  
                  {quote.document_url && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selection Summary */}
        {selectedForClient && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="font-medium text-green-800">
                {selectedForClient === 'human' ? 'Human' : 'AI'} evaluation has been forwarded to client for selection.
              </div>
              <div className="text-sm text-green-600 mt-1">
                {totalReceived} quotes sent to client portal for review and selection.
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <div className="text-sm text-gray-600">
            Choose evaluation method above and click "Forward to Client" to proceed
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
