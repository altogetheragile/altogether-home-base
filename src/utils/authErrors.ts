export type FriendlyAuthError = {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
};

export const getFriendlyAuthError = (error: any, action: 'sign-in' | 'sign-up' = 'sign-in'): FriendlyAuthError => {
  const raw = (error?.message || error?.error_description || '').toString();
  const msg = raw.toLowerCase();

  // Common patterns
  if (msg.includes('invalid login credentials')) {
    return {
      title: action === 'sign-in' ? 'Sign in failed' : 'Authentication failed',
      description: 'Incorrect email or password. Please try again.',
      variant: 'destructive',
    };
  }

  // Two different limits wore the same message, and one of them was being told the wrong thing.
  // Sign-in throttling does clear in minutes. The limit on sending email does not: Supabase's
  // built-in mail service allows a handful an hour, so "wait a few minutes" sends somebody back to
  // press the button again and be refused again, with no idea why.
  if (msg.includes('email rate limit') || (msg.includes('rate limit') && msg.includes('email'))) {
    return {
      title: 'Too many emails requested',
      description:
        'The limit on sending is hourly, not a few minutes. If you already have one of these '
        + 'emails, use it - the most recent link is the one that works.',
      variant: 'destructive',
    };
  }

  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return {
      title: 'Too many attempts',
      description: 'Please wait a few minutes before trying again.',
      variant: 'destructive',
    };
  }

  if (msg.includes('confirm') && msg.includes('email')) {
    return {
      title: 'Email not verified',
      description: 'Please verify your email before signing in.',
      variant: 'destructive',
    };
  }

  if ((msg.includes('breach') || msg.includes('pwned') || msg.includes('compromised')) && msg.includes('password')) {
    return {
      title: 'Weak or compromised password',
      description: 'This password has appeared in a data breach. Choose a different one.',
      variant: 'destructive',
    };
  }

  if (msg.includes('password should be at least') || msg.includes('password too short')) {
    return {
      title: 'Weak password',
      description: 'Use a stronger password with at least 8 characters.',
      variant: 'destructive',
    };
  }

  if (msg.includes('otp') && msg.includes('expired')) {
    return {
      title: 'Code expired',
      description: 'Your verification code expired. Request a new one.',
      variant: 'destructive',
    };
  }

  if (msg.includes('user already registered') || msg.includes('already a user')) {
    return {
      title: 'Account exists',
      description: 'An account with this email already exists. Try signing in instead.',
      variant: 'destructive',
    };
  }

  return {
    title: action === 'sign-up' ? 'Sign-up error' : 'Authentication error',
    description: raw || 'Something went wrong. Please try again.',
    variant: 'destructive',
  };
};
