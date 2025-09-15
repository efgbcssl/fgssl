import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <Shield className="h-8 w-8 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        Access Denied
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-gray-600">
                        You don't have permission to access this page. Please contact an administrator if you believe this is an error.
                    </p>
                    <div className="space-y-2">
                        <Button asChild className="w-full">
                            <Link href="/dashboard">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/">
                                <Home className="h-4 w-4 mr-2" />
                                Go Home
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


