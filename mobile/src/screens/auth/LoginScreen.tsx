import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/types';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuthStore } from '../../store/authStore';
import { authProvider } from '../../services/auth';

interface LoginScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login, isLoading } = useAuthStore();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = '이메일을 입력해주세요';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = '올바른 이메일 형식이 아닙니다';
    if (!password) newErrors.password = '비밀번호를 입력해주세요';
    else if (password.length < 6) newErrors.password = '비밀번호는 6자 이상이어야 합니다';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert('로그인 실패', err?.response?.data?.detail ?? '이메일 또는 비밀번호를 확인해주세요');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    try {
      const { socialLogin } = useAuthStore.getState();
      await socialLogin(provider);
    } catch (err: any) {
      Alert.alert('소셜 로그인 실패', err?.message ?? `${provider} 로그인에 실패했습니다`);
    }
  };

  return (
    <KeyboardAvoidingView
      testID="screen-login"
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Ionicons name="leaf" size={40} color={Colors.white} />
          </View>
          <Text style={styles.appName}>FarmDirect</Text>
          <Text style={styles.tagline}>농부와 소비자를 직접 연결합니다</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="이메일"
            placeholder="이메일을 입력하세요"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
            testID="login-email-input"
          />
          <Input
            label="비밀번호"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon="lock-closed-outline"
            error={errors.password}
            testID="login-password-input"
          />

          <TouchableOpacity
            testID="login-forgot-button"
            style={styles.forgotPassword}
            onPress={async () => {
              if (!email) {
                Alert.alert('비밀번호 재설정', '이메일을 먼저 입력해주세요');
                return;
              }
              try {
                await authProvider.resetPassword(email);
                Alert.alert('비밀번호 재설정', '비밀번호 재설정 이메일이 발송되었습니다');
              } catch (err: any) {
                Alert.alert('오류', err?.message ?? '비밀번호 재설정에 실패했습니다');
              }
            }}
          >
            <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
          </TouchableOpacity>

          <Button
            title="로그인"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            size="lg"
            style={styles.loginButton}
            testID="login-submit-button"
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity
              testID="login-kakao-button"
              style={[styles.socialBtn, styles.kakaoBtn]}
              onPress={() => handleSocialLogin('kakao')}
            >
              <Ionicons name="chatbubble" size={20} color="#3C1E1E" />
              <Text style={styles.kakaoText}>카카오로 계속하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="login-google-button"
              style={[styles.socialBtn, styles.googleBtn]}
              onPress={() => handleSocialLogin('google')}
            >
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={styles.googleText}>Google로 계속하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>아직 계정이 없으신가요? </Text>
          <TouchableOpacity testID="login-signup-link" onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signUpLink}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 80,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: Fonts.sizes.title,
    fontWeight: Fonts.weights.extrabold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: Fonts.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  form: {
    padding: Spacing.xl,
    marginTop: -Spacing.lg,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
  },
  loginButton: {
    marginTop: Spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
  },
  socialButtons: {
    gap: Spacing.md,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  kakaoBtn: {
    backgroundColor: '#FEE500',
    borderColor: '#FEE500',
  },
  kakaoText: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.semibold,
    color: '#3C1E1E',
  },
  googleBtn: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
  },
  googleText: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.semibold,
    color: Colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  footerText: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
  },
  signUpLink: {
    fontSize: Fonts.sizes.md,
    color: Colors.primary,
    fontWeight: Fonts.weights.bold,
  },
});
