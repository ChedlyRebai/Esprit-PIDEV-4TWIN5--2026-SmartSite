import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { FileText, Loader2, Mail, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function DailyReportButton() {
  const [showDialog, setShowDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleGenerateReport = async () => {
    console.log('🔵 [FRONTEND] handleGenerateReport appelé');
    console.log('🔵 [FRONTEND] Email saisi:', email);
    
    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      console.log('🔴 [FRONTEND] Email invalide');
      toast.error('Please enter a valid email address');
      return;
    }

    console.log('🟢 [FRONTEND] Email valide');
    setLoading(true);
    setSuccess(false);

    try {
      console.log('🔵 [FRONTEND] Envoi de la requête POST...');
      console.log('🔵 [FRONTEND] URL:', '/api/materials/reports/daily/send');
      console.log('🔵 [FRONTEND] Body:', { email: email.trim() });
      
      const response = await axios.post('/api/materials/reports/daily/send', {
        email: email.trim()
      });

      console.log('🟢 [FRONTEND] Réponse reçue:', response.data);

      if (response.data.success) {
        console.log('🟢 [FRONTEND] Succès!');
        setSuccess(true);
        toast.success(`✅ Report sent successfully to ${email}`, {
          duration: 5000,
          description: 'Check your email inbox or Ethereal messages'
        });
        
        setTimeout(() => {
          setShowDialog(false);
          setSuccess(false);
          setEmail('');
        }, 3000);
      } else {
        console.log('🔴 [FRONTEND] Échec:', response.data.message);
        const errorMessage = response.data.message || 'Error generating report';
        toast.error(`❌ ${errorMessage}`, {
          duration: 7000,
          description: 'Please check the backend logs for more details'
        });
      }
    } catch (error: any) {
      console.log('🔴 [FRONTEND] Exception capturée:', error);
      console.log('🔴 [FRONTEND] Error response:', error.response?.data);
      console.log('🔴 [FRONTEND] Error message:', error.message);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Error generating report';
      
      toast.error(`❌ Failed to send report`, {
        duration: 7000,
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
      >
        <FileText className="h-4 w-4 mr-2" />
        Generate AI Report
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Generate Daily AI Report
            </DialogTitle>
            <DialogDescription>
              Generate a comprehensive report with AI stock analysis and recommendations.
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-lg font-medium text-green-700">Report sent successfully!</p>
              <p className="text-sm text-gray-500 mt-2">Check your email inbox</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerateReport()}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  The report will be sent to this email address
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium mb-2">📊 Report includes:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Low stock and out of stock materials</li>
                  <li>• Materials expiring soon</li>
                  <li>• Detected anomalies (24h)</li>
                  <li>• Order recommendations</li>
                </ul>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800 font-medium mb-1">📬 Testing Mode (Ethereal Email)</p>
                <p className="text-xs text-purple-700">
                  Emails are captured by Ethereal. View them at:{' '}
                  <a 
                    href="https://ethereal.email/messages" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline font-medium hover:text-purple-900"
                  >
                    ethereal.email/messages
                  </a>
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Login: jamar.wisoky@ethereal.email
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateReport}
                  disabled={loading || !email}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate & Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
