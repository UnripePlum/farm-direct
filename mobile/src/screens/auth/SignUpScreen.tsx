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
import { Colors, Fonts, Spacing } from '../../theme';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuthStore } from '../../store/authStore';

interface SignUpScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const { signup, isLoading } = useAuthStore();

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const newErrors: Partial<typeof form> = {};
    if (!form.name) newErrors.name = '이름을 입력해주세요';
    if (!form.email) newErrors.email = '이메일을 입력해주세요';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = '올바른 이메일 형식이 아닙니다';
    if (!form.password) newErrors.password = '비밀번호를 입력해주세요';
    else if (form.password.length < 8) newErrors.password = '비밀번호는 8자 이상이어야 합니다';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    try {
      await signup({
        name: form.name,
        email: form.email,
        role: 'consumer',
        phone: form.phone || undefined,
      }, form.email, form.password);
    } catch (err: any) {
      const errData = err?.response?.data;
      if (errData?.detail) Alert.alert('회원가입 실패', errData.detail);
      else Alert.alert('회원가입 실패', '다시 시도해주세요');
    }
  };

  return (
    <KeyboardAvoidingView
      testID="screen-signup"
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>FarmDirect와 함께 신선한 시작을</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="이름"
            placeholder="실명을 입력하세요"
            value={form.name}
            onChangeText={(v) => updateField('name', v)}
            leftIcon="person-outline"
            error={errors.name}
            testID="signup-name-input"
          />
          <Input
            label="이메일"
            placeholder="이메일을 입력하세요"
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
            testID="signup-email-input"
          />
          <Input
            label="휴대폰 번호"
            placeholder="010-0000-0000"
            value={form.phone}
            onChangeText={(v) => updateField('phone', v)}
            keyboardType="phone-pad"
            leftIcon="call-outline"
            testID="signup-phone-input"
          />
          <Input
            label="비밀번호"
            placeholder="8자 이상의 비밀번호"
            value={form.password}
            onChangeText={(v) => updateField('password', v)}
            isPassword
            leftIcon="lock-closed-outline"
            error={errors.password}
            testID="signup-password-input"
          />
          <Input
            label="비밀번호 확인"
            placeholder="비밀번호를 다시 입력하세요"
            value={form.confirmPassword}
            onChangeText={(v) => updateField('confirmPassword', v)}
            isPassword
            leftIcon="lock-closed-outline"
            error={errors.confirmPassword}
            testID="signup-confirm-password-input"
          />

          <Text style={styles.terms}>
            가입 시 <Text style={styles.termsLink}>이용약관</Text> 및{' '}
            <Text style={styles.termsLink}>개인정보처리방침</Text>에 동의하게 됩니다.
          </Text>

          <Button
            title="회원가입"
            onPress={handleSignUp}
            loading={isLoading}
            fullWidth
            size="lg"
            style={styles.signUpButton}
            testID="signup-submit-button"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>이미 계정이 있으신가요? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>로그인</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, paddingBottom: Spacing.xxxl },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.white,
  },
  backButton: {
    marginBottom: Spacing.lg,
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    fontSize: Fonts.sizes.title,
    fontWeight: Fonts.weights.extrabold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
  },
  form: {
    padding: Spacing.xl,
  },
  terms: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginVertical: Spacing.lg,
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: Fonts.weights.medium,
  },
  signUpButton: { marginTop: Spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  footerText: { fontSize: Fonts.sizes.md, color: Colors.textSecondary },
  loginLink: { fontSize: Fonts.sizes.md, color: Colors.primary, fontWeight: Fonts.weights.bold },
});
