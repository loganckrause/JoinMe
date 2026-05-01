import { Alert, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { BackButton } from '@/components/back-button';
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { parseAgeFromDob } from '@/services/signup-flow';


export default function SignupScreen() {
    const [secure, setSecure] = useState(true);
    const [secureConfirm, setSecureConfirm] = useState(true);

    const [fname, setFname] = useState('');
    const [lname, setLname] = useState('');
    const [dob, setDob] = useState('');
    const [city, setCity] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [cnfmPassword, setCnfmPassword] = useState('');

    useFocusEffect(
        useCallback(() => {
            setFname('');
            setLname('');
            setDob('');
            setCity('');
            setEmail('');
            setPassword('');
            setCnfmPassword('');
            setSecure(true);
            setSecureConfirm(true);
        }, [])
    )

    const handleSignupPress = () => {
        const trimmedFirstName = fname.trim();
        const trimmedLastName = lname.trim();
        const trimmedCity = city.trim();
        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedFirstName || !trimmedLastName || !dob.trim() || !trimmedCity || !trimmedEmail || !password || !cnfmPassword) {
            Alert.alert('Missing fields', 'Please complete all fields before continuing.');
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
            Alert.alert('Invalid email', 'Please enter a valid email address.');
            return;
        }

        if (password !== cnfmPassword) {
            Alert.alert('Password mismatch', 'Your password and confirmation do not match.');
            return;
        }

        const age = parseAgeFromDob(dob.trim());
        if (!age) {
            Alert.alert('Invalid date of birth', 'Please enter date of birth in mm/dd/yyyy format.');
            return;
        }
        if (age < 18) {
             Alert.alert('Age requirement', 'You must be 18 or older to sign up.');
        return;
        }

        router.push({
            pathname: '/interests-pick',
            params: {
                email: trimmedEmail,
                password,
                fullName: `${trimmedFirstName} ${trimmedLastName}`,
                age: String(age),
                city: trimmedCity,
            },
        });
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ParallaxScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            headerBackgroundColor={{ light: '#fff', dark: '#0a0a0bff'}}
        >
            <BackButton testID="backbutton"/>
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.title}>Sign-up</ThemedText>
                <ThemedView style={styles.inputContainer}>
                    <ThemedText style={styles.text}>Name</ThemedText>
                    <TextInput
                        placeholder="Enter your first name"
                        placeholderTextColor='#888'
                        style={styles.input}
                        value={fname}
                        onChangeText={setFname}
                    />
                    <ThemedText style={styles.text}>Last Name</ThemedText>
                    <TextInput
                        placeholder="Enter your last name"
                        placeholderTextColor='#888'
                        style={styles.input}
                        value={lname}
                        onChangeText={setLname}
                    />
                    <ThemedText style={styles.text}>Date of birth</ThemedText>
                    <TextInput
                        placeholder="mm/dd/yyyy"
                        placeholderTextColor='#888'
                        style={styles.input}
                        value={dob}
                        onChangeText={setDob}
                    />
                    <ThemedText style={styles.text}>City</ThemedText>
                    <TextInput
                        placeholder="Enter your city"
                        placeholderTextColor='#888'
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                    />
                    <ThemedText style={styles.text}>Email</ThemedText>
                    <TextInput
                        placeholder="Enter your email"
                        placeholderTextColor='#888'
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                    />
                    <ThemedView style={styles.passwordContainer}>
                        <ThemedText style={styles.text}>Password</ThemedText>
                        <TextInput
                            placeholder="Enter your password"
                            placeholderTextColor='#888'
                            style={styles.input}
                            secureTextEntry={secure}
                            value={password}
                            onChangeText={setPassword}
                            autoComplete="new-password"
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
                            value={cnfmPassword}
                            onChangeText={setCnfmPassword}
                            autoComplete="new-password"
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
            <TouchableOpacity testID="signupbutton" onPress={handleSignupPress}>
                <ThemedText type="defaultSemiBold" style={styles.button}>Sign-up</ThemedText>
            </TouchableOpacity>
        </ParallaxScrollView>
        </KeyboardAvoidingView>
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
    },
});