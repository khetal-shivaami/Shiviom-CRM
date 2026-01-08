import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ImageCarousel } from '@/components/ImageCarousel';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CrmLogo = () => (
  <div className="flex items-center gap-3 text-white">
    <img
      src="https://storage.googleapis.com/shiviom-website-content/company_logo/shiviom.png"
      alt="Shiviom Logo"
      className="h-25 w-23"
    />
    {/* <span className="font-semibold text-2xl tracking-tight">Shiviom CRM</span> */}
  </div>
);

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);

  const { signIn, user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Step 1: Authenticate with Supabase Auth. This checks against the auth.users table.
      const { data: authData, error: authError } = await signIn(email, password);
      
      if (authError || !authData?.user) {
        const message = authError?.message || 'Invalid login credentials.';
        setError(message);
        toast({
          title: "Login Failed",
          description: message,
          variant: "destructive",
        });
        // If an error occurred but a user object was still returned (e.g. email not confirmed),
        // we must sign out to prevent the useEffect hook from navigating to the dashboard.
        if (authData?.user) {
          await signOut();
        }
        return;
      }

      // Step 2: Authorize against the 'profiles' table.
      // After successful authentication, we check the user's profile for status.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError || !profile) {
        setError("Could not retrieve your user profile. Please try again or contact support.");
        toast({ title: "Login Error", description: "Failed to retrieve user profile.", variant: "destructive" });
        await signOut(); // Sign out if profile is missing
        return;
      }

      if (profile.status !== 'active') {
        const message = `Your account is currently ${profile.status}. Please contact an administrator.`;
        setError(message);
        toast({ title: "Login Denied", description: message, variant: "destructive" });
        await signOut(); // Sign out if user is not active
        return;
      }

      // Step 3: Update last_login timestamp in the profile.
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', authData.user.id);

      if (updateError) {
        // Log this error but don't prevent the user from logging in.
        console.error("Failed to update last login time:", updateError.message);
      }

      // Step 4: Success! User is authenticated and authorized.
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
     <div className="w-full min-h-screen relative flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0">
          <ImageCarousel />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/100 to-slate-800/90" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.04) 2%, transparent 0%)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>
      {/* Content */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <CrmLogo />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h1>
          <p className="text-slate-300">Sign in to continue to Shiviom CRM</p>
        </div>
        <Card className="bg-background/80 backdrop-blur-sm border-slate-700">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="name@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <Link
                  to="/auth/reset"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
        {/* <div className="text-center">
          <Button variant="link" className="text-slate-300 hover:text-white" onClick={() => setShowCredentials(!showCredentials)}>
            {showCredentials ? 'Hide' : 'Show'} Test Credentials
          </Button>
        </div> */}
        {showCredentials && (
          <Card className="border-amber-200/30 bg-amber-950/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-amber-200">
                Test Credentials
              </CardTitle>
              <p className="text-sm text-amber-300">
                Create these users in Supabase Dashboard first, then use for testing:
              </p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-amber-200">Admin Account:</p>
                <p className="text-amber-300 font-mono">admin@shiviom.com / admin123</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-amber-200">Manager Account:</p>
                <p className="text-amber-300 font-mono">manager@shiviom.com / manager123</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-amber-200">User Account:</p>
                <p className="text-amber-300 font-mono">user@shiviom.com / user123</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="absolute z-10 bottom-5  text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} Shiviom Inc. All rights reserved.
      </div>
    </div>
  );
};

export default Auth;