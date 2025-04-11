import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Copy, Check, Share2, Mail, Facebook, Twitter, Link as LinkIcon } from 'lucide-react';
import { modelApi } from '../../services/api';

export default function ShareModelDialog({ model, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  // Generate share URL
  const shareUrl = `${window.location.origin}/view/${model?.id}`;
  
  // Generate embed code
  const embedCode = `<iframe src="${window.location.origin}/embed/${model?.id}" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`;

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Share via email
  const handleEmailShare = async (e) => {
    e.preventDefault();
    setError('');
    setEmailSent(false);
    
    if (!email) {
      setError('Please enter an email address');
      return;
    }
    
    setSending(true);
    
    try {
      await modelApi.shareModelViaEmail({
        modelId: model.id,
        email,
        message,
      });
      
      setEmailSent(true);
      setEmail('');
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Share on social media
  const shareOnSocialMedia = (platform) => {
    let url;
    
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out this 3D model: ${model?.name}`)}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="h-5 w-5 mr-2" />
            Share 3D Model
          </DialogTitle>
          <DialogDescription>
            Share "{model?.name}" with others
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-link">Share Link</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="share-link"
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(shareUrl)}
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="flex space-x-2 justify-center mt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={() => shareOnSocialMedia('facebook')}
              >
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={() => shareOnSocialMedia('twitter')}
              >
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="email" className="space-y-4">
            {emailSent ? (
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-600">
                  Email sent successfully!
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleEmailShare} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Recipient Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="friend@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <textarea
                    id="message"
                    className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md"
                    placeholder="Check out this 3D model I created!"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={sending}>
                  {sending ? 'Sending...' : 'Send Email'}
                </Button>
              </form>
            )}
          </TabsContent>
          
          <TabsContent value="embed" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="embed-code">Embed Code</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="embed-code"
                  value={embedCode}
                  readOnly
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(embedCode)}
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Copy and paste this code to embed the 3D model on your website.
              </p>
            </div>
            
            <div className="border rounded-md p-4 bg-gray-50">
              <p className="text-sm font-medium mb-2">Preview</p>
              <div className="aspect-video bg-white border rounded-md flex items-center justify-center">
                <div className="text-center p-4">
                  <LinkIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Embedded 3D Model Preview</p>
                  <p className="text-xs text-gray-500 mt-1">{model?.name}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-start">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
