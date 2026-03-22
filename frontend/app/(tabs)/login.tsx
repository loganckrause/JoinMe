import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';


export default function LoginScreen() {
    const [secure, setSecure] = useState(true);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useFocusEffect(
        useCallback(() => {
            setEmail('');
            setPassword('');
        }, [])
    )

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#fff', dark: '#151718'}}
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
                        />
                        <TouchableOpacity
                            onPress={() => setSecure(!secure)}
                            style={styles.toggle}
                        >
                            <IconSymbol
                                name={secure ? 'eye.slash' : 'eye'}
                                color="#bebebeff"
                            />
                        </TouchableOpacity>
                    </ThemedView>
                </ThemedView>
                <TouchableOpacity onPress={() => router.push('/loginhelp')} >
                    <ThemedText style={styles.link}>Forgot Password?</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity>
                    <ThemedText type="defaultSemiBold" style={styles.button}>Login</ThemedText>
                </TouchableOpacity>
            </ThemedView>
            <TouchableOpacity onPress={() => router.push('/signup')}>
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