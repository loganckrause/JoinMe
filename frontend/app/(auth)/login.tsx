import { StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth';

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';


export default function LoginScreen() {
    const [secure, setSecure] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuthStore();

    useFocusEffect(
        useCallback(() => {
            setEmail('');
            setPassword('');
            setSecure(true);
        }, [])
    )

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            router.replace('/(tabs)/feed');
        } catch (error) {
            Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#fff', dark: '#0a0a0bff'}}
        >
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.title}>Login</ThemedText>
                <ThemedView style={styles.inputContainer}>
                    <ThemedText>Email</ThemedText>
                    <TextInput
                        placeholder="Enter your email"
                        placeholderTextColor='#888'
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        editable={!loading}
                    />
                    <ThemedText>Password</ThemedText>
                    <ThemedView style={styles.passwordContainer}>
                        <TextInput
                            placeholder="Enter your password"
                            placeholderTextColor='#888'
                            style={styles.input}
                            secureTextEntry={secure}
                            value={password}
                            onChangeText={setPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity
                            onPress={() => setSecure(!secure)}
                            style={styles.toggle}
                            disabled={loading}
                        >
                            <IconSymbol
                                name={secure ? 'eye.slash' : 'eye'}
                                color="#bebebeff"
                            />
                        </TouchableOpacity>
                    </ThemedView>
                </ThemedView>
                <TouchableOpacity onPress={() => router.push('/loginhelp')} disabled={loading}>
                    <ThemedText style={styles.link}>Forgot Password?</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogin} disabled={loading}>
                    <ThemedText type="defaultSemiBold" style={styles.button}>
                        {loading ? 'Logging in...' : 'Login'}
                    </ThemedText>
                </TouchableOpacity>
            </ThemedView>
            <TouchableOpacity onPress={() => router.push('/signup')} disabled={loading}>
                <ThemedText style={styles.buttoncl}>Sign Up</ThemedText>
            </TouchableOpacity>
        </ParallaxScrollView>
    )
    
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginTop: 10,
  },
  title: {
    textAlign: 'center',
  },
  inputContainer: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 13,
    fontSize: 13,
    color: '#fff',
    paddingRight: 50,
  },
  button: {
    backgroundColor: '#59d386ff',
    textAlign: 'center',
    color: '#fff',
    padding: 14,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 5,
  },
  passwordContainer: {
    position: 'relative',
  },
  toggle: {
    position: 'absolute',
    right: 15,
    top: '26%',
  },
  link: {
    textAlign: 'right',
    color: '#3f85daff',
    textDecorationLine: 'underline',
  },
  buttoncl: {
    textAlign: 'center',
    padding: 14,
    borderRadius: 100,
    color: '#fff',
    borderColor: '#fff',
    borderWidth: 1,
  }
});