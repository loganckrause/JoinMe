import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';


export default function SignupScreen() {
    const [secure, setSecure] = useState(true);
    const [secureConfirm, setSecureConfirm] = useState(true);
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#fff', dark: '#151718'}}
        >
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.title}>Sign-up</ThemedText>
                <ThemedView style={styles.inputContainer}>
                    <ThemedText style={styles.text}>Name</ThemedText>
                    <TextInput
                        placeholder="Enter your first name"
                        placeholderTextColor='#888'
                        style={styles.input}
                    />
                    <ThemedText style={styles.text}>Last Name</ThemedText>
                    <TextInput
                        placeholder="Enter your last name"
                        placeholderTextColor='#888'
                        style={styles.input}
                    />
                    <ThemedText style={styles.text}>Date of birth</ThemedText>
                    <TextInput
                        placeholder="mm/dd/yyyy"
                        placeholderTextColor='#888'
                        style={styles.input}
                    />
                    <ThemedText style={styles.text}>Email</ThemedText>
                    <TextInput
                        placeholder="Enter your email"
                        placeholderTextColor='#888'
                        style={styles.input}
                    />
                    <ThemedView style={styles.passwordContainer}>
                        <ThemedText style={styles.text}>Password</ThemedText>
                        <TextInput
                            placeholder="Enter your password"
                            placeholderTextColor='#888'
                            style={styles.input}
                            secureTextEntry={secure}
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
                    <ThemedView style={styles.passwordCfContainer}>
                        <ThemedText style={styles.text}>Confirm Password</ThemedText>
                        <TextInput
                            placeholder="Confirm your password"
                            placeholderTextColor='#888'
                            style={styles.input}
                            secureTextEntry={secureConfirm}
                        />
                        <TouchableOpacity
                            onPress={() => setSecureConfirm(!secureConfirm)}
                            style={styles.toggle}
                        >
                            <IconSymbol
                                name={secureConfirm ? 'eye.slash' : 'eye'}
                                color="#bebebeff"
                            />
                        </TouchableOpacity>
                    </ThemedView>
                </ThemedView>
            </ThemedView>
            <TouchableOpacity>
                <ThemedText type="defaultSemiBold" style={styles.button}>Sign-up</ThemedText>
            </TouchableOpacity>
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
        marginBottom: 5,
    },
    inputContainer: {
        gap: 7,
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
    text: {
        fontSize: 15,
    },
    passwordContainer: {
        position: 'relative',
        gap: 7,
    },
    passwordCfContainer: {
        position: 'relative',
        gap: 7,
    },
    toggle: {
        position: 'absolute',
        right: 15,
        top: '55%',
    },
    button: {
        backgroundColor: '#59d386ff',
        textAlign: 'center',
        color: '#fff',
        padding: 14,
        borderRadius: 100,
        alignItems: 'center',
        marginTop: 5,
    }
});