
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
}

const AccessDenied = ({ 
  title = "Access Denied", 
  message = "You don't have permission to access this page. Please contact your administrator if you believe this is an error.",
  showBackButton = true 
}: AccessDeniedProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600 leading-relaxed">{message}</p>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={() => navigate('/')}
              className="flex items-center justify-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Go Home</span>
            </Button>
            
            {showBackButton && (
              <Button 
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Go Back</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDenied;
