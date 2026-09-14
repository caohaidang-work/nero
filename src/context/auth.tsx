import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

// SỬ DỤNG LINK API CHUẨN CỦA SPOTIFY
const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

const MY_CLIENT_ID = '6022c98cc7c04f4499586b76566e9bf4';

interface AuthContextType {
  accessToken: string | null;
  isAuthenticating: boolean;
  login: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: MY_CLIENT_ID,
      scopes: [
        'user-read-recently-played',
        'user-top-read',
        'user-read-currently-playing',
        'user-read-playback-state',
        'playlist-read-private', // QUYỀN MỚI: Lấy danh sách Playlist
        'playlist-read-collaborative'
      ],
      usePKCE: true,
      redirectUri: AuthSession.makeRedirectUri(),
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      AuthSession.exchangeCodeAsync(
        {
          clientId: MY_CLIENT_ID,
          code,
          redirectUri: AuthSession.makeRedirectUri(),
          extraParams: { code_verifier: request?.codeVerifier || '' },
        },
        discovery
      )
        .then((res) => {
          setAccessToken(res.accessToken);
        })
        .catch((err) => console.error('Lỗi đổi mã Token:', err));
    }
  }, [response]);

  const login = async () => {
    setIsAuthenticating(true);
    try {
      if (request) await promptAsync();
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <AuthContext.Provider value={{ accessToken, isAuthenticating, login }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải được dùng trong AuthProvider');
  return context;
};