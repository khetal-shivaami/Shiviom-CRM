import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ImageCarousel } from '@/components/ImageCarousel';
import { Eye, EyeOff, Loader as Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CrmLogo = () => (
  <div className="flex items-center gap-3 text-white">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
      <img
        src="https://storage.googleapis.com/shiviom-website-content/company_logo/shiviom.png"
        alt="Shiviom Logo"
        className="h-7 w-7 object-contain brightness-0 invert"
      />
    </div>
    <div className="flex flex-col">
      <span className="text-lg font-bold leading-tight">Shiviom CRM</span>
      <span className="text-[11px] text-slate-400 leading-tight">Partner Management Suite</span>
    </div>
  </div>
);

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

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
      const { data: authData, error: authError } = await signIn(email, password);

      if (authError || !authData?.user) {
        const message = authError?.message || 'Invalid login credentials.';
        setError(message);
        toast({
          title: "Login Failed",
          description: message,
          variant: "destructive",
        });
        if (authData?.user) {
          await signOut();
        }
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError || !profile) {
        setError("Could not retrieve your user profile. Please try again or contact support.");
        toast({ title: "Login Error", description: "Failed to retrieve user profile.", variant: "destructive" });
        await signOut();
        return;
      }

      if (profile.status !== 'active') {
        const message = `Your account is currently ${profile.status}. Please contact an administrator.`;
        setError(message);
        toast({ title: "Login Denied", description: message, variant: "destructive" });
        await signOut();
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', authData.user.id);

      if (updateError) {
        console.error("Failed to update last login time:", updateError.message);
      }

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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-800/85" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.04) 2%, transparent 0%)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md space-y-6 animate-in-up">
        <div className="flex justify-center">
          <CrmLogo />
        </div>
        <div className="text-center">
          <h1 className="text-[28px] font-bold tracking-tight text-white">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to continue to Shiviom CRM</p>
        </div>

        <Card className="bg-background/90 backdrop-blur-md border-slate-700/50 shadow-2xl">
          <CardContent className="p-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="text-sm">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="name@company.com"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[13px] font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="••••••••"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Secured by Supabase Auth</span>
        </div>
      </div>

      <div className="absolute z-10 bottom-5 text-slate-500 text-xs">
        &copy; {new Date().getFullYear()} Shiviom Inc. All rights reserved.
      </div>
    </div>
  );
};

export default Auth;
