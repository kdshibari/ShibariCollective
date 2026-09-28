// Inside AuthPage component in src/routes/auth.tsx...

  const [redirectPath, setRedirectPath] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const intent = params.get("intent");
    const redirect = params.get("redirect");
    
    if (intent === "owner" || intent === "User") {
      setMode(intent);
    }
    if (redirect) {
      setRedirectPath(redirect);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Use standard window location for dynamic redirects to avoid router typing issues
        window.location.href = redirect || "/dashboard";
      }
    });
  }, []);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          toast.error(formatAuthError(error));
          return;
        }

        if (data.session) {
          setSubmitted(true);
          window.location.href = redirectPath;
        } else if (data.user) {
          toast.success("Account created! Please check your email for a verification link.");
          setIsSignUp(false); 
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          toast.error(formatAuthError(error));
          return;
        }

        if (data.session) {
          setSubmitted(true);
          window.location.href = redirectPath;
        }
      }
    } catch (error) {
      toast.error(formatAuthError(error));
    } finally {
      setLoading(false);
    }
  }
