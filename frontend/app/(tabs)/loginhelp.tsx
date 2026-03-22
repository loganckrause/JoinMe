import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from '@/components/themed-text';

export default function LoginHelpScreen() {

    const [email, setEmail] = useState('');

    useFocusEffect(
        useCallback(() => {
            setEmail('');
        }, [])
    )

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#fff', dark: '#151718'}}
        >
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.title}>Forgot password?</ThemedText>
                <ThemedText style={styles.txt}>Please enter your email to get a OTP</ThemedText>
                <ThemedView style={styles.inputContainer}>
                    <ThemedText>Email</ThemedText>
                    <TextInput
                        placeholder="Enter your email"
                        placeholderTextColor='#888'
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                    />
                </ThemedView>
                <TouchableOpacity>
                    <ThemedText type="defaultSemiBold" style={styles.button}>Request password reset</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/login')}>
                    <ThemedText style={styles.buttoncan}>Back to Sign In</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        </ParallaxScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        gap: 16,
        marginTop: 10,
        marginBottom: 30,
    },
    title: {
        textAlign: 'center',
        fontSize: 30,
        textAlign: 'left',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 13,
        fontSize: 12,
        color: '#fff',
        paddingRight: 50,
    },
    inputContainer: {
        marginBottom: 0,
        gap: 8,
    },
    button: {
    backgroundColor: '#59d386ff',
    textAlign: 'center',
    color: '#fff',
    padding: 14,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 290,
  },
  buttoncan: {
    textAlign: 'center',
    padding: 14,
    borderRadius: 100,
    color: '#fff',
    borderColor: '#fff',
    borderWidth: 1,
  },
  txt: {
    fontSize: 16,
    marginBottom: 20,
  },
})