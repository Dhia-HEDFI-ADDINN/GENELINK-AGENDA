'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  Input,
  Button,
  Alert,
  Card,
  CardContent,
  CalendarIcon,
  EnvelopeIcon,
  LockClosedIcon,
} from '@pti-calendar/design-system';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      await login(data.email, data.password);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <CalendarIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">PTI Calendar Pro</h1>
          <p className="text-gray-400 mt-2">Espace Centre de Contrôle</p>
        </div>

        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              Connexion
            </h2>

            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Email"
                type="email"
                placeholder="votre.email@sgs.com"
                leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                {...register('email')}
                error={errors.email?.message}
              />

              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                leftIcon={<LockClosedIcon className="h-5 w-5" />}
                {...register('password')}
                error={errors.password?.message}
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-600">Se souvenir de moi</span>
                </label>
                <a href="/forgot-password" className="text-sm text-primary-600 hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>

              <Button type="submit" fullWidth disabled={isLoading}>
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-500 text-sm mt-8">
          © {new Date().getFullYear()} SGS France - PTI Calendar
        </p>
      </motion.div>
    </div>
  );
}
