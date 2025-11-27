'use client';

import { useState } from 'react';
import { useAuth } from '../providers';
import { Input, Button, Alert, Card, CardContent, PhoneIcon, EnvelopeIcon, LockClosedIcon } from '@pti-calendar/design-system';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch {
      setError('Identifiants incorrects');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4">
            <PhoneIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">PTI CallCenter</h1>
          <p className="text-green-300 mt-2">Centre d'appels SGS</p>
        </div>

        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Connexion agent</h2>
            {error && <Alert variant="error" className="mb-6">{error}</Alert>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                required
              />
              <Input
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<LockClosedIcon className="h-5 w-5" />}
                required
              />
              <Button type="submit" fullWidth disabled={isLoading}>
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
