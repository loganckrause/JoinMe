import { StyleSheet, TextInput, TouchableOpacity, Image, Alert, KeyboardAvoidingView } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { BackButton } from '@/components/back-button';
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/auth';
import { asSingleParam, parseCategoryIdsParam } from '@/services/signup-flow';


const BIO_MAX_LENGTH = 300;

export default function CompleteProfileScreen() {
    const params = useLocalSearchParams<{
        email?: string;
        password?: string;
        fullName?: string;
        age?: string;
        city?: string;
        categoryIds?: string;
    }>();
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);
    const register = useAuthStore(state => state.register);

    const email = asSingleParam(params.email);
    const password = asSingleParam(params.password);
    const fullName = asSingleParam(params.fullName);
    const age = asSingleParam(params.age);
    const city = asSingleParam(params.city);
    const categoryIdsParam = asSingleParam(params.categoryIds);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handleFinish = async () => {
        if (!photoUri || bio.length === 0) {
            Alert.alert('Incomplete Profile', 'Please upload a photo and write a bio to continue.');
            return;
        }

        if (!email || !password || !fullName || !age || !city || !categoryIdsParam) {
            Alert.alert('Missing signup data', 'Please restart signup and try again.');
            return;
        }

        const categoryIds = parseCategoryIdsParam(categoryIdsParam);

        if (categoryIds.length === 0) {
            Alert.alert('Missing interests', 'Please go back and select at least one interest.');
            return;
        }

        const parsedAge = Number(age);
        if (!Number.isInteger(parsedAge) || parsedAge <= 0) {
            Alert.alert('Invalid age', 'Please restart signup and enter a valid date of birth.');
            return;
        }

        setLoading(true);
        try {
            await register({
                email,
                password,
                fullName,
                age: parsedAge,
                bio,
                city,
                categoryIds,
                imageUri: photoUri,
            });
            router.replace('/feed');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Signup failed';
            Alert.alert('Signup failed', message);
        } finally {
            setLoading(false);
        }

    };

    const canFinish = !!photoUri && bio.length > 0;

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#fff', dark: '#0a0a0bff' }}
        >
            <BackButton />
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.title}>Complete{'\n'}your profile</ThemedText>

                {/* Profile photo picker */}
                <TouchableOpacity style={styles.photoWrapper} onPress={pickImage} activeOpacity={0.8}>
                    {photoUri ? (
                        <>
                            <Image source={{ uri: photoUri }} style={styles.photo} />
                            {/* Checkmark overlay */}
                            <ThemedView style={styles.checkOverlay}>
                                <IconSymbol name="checkmark" color="#fff" size={32} />
                            </ThemedView>
                            <ThemedText style={styles.photoLabel}>Upload Complete</ThemedText>
                        </>
                    ) : (
                        <>
                            <ThemedView style={styles.photoDashed}>
                                <IconSymbol name="camera" color="#888" size={40} />
                            </ThemedView>
                            <ThemedText style={styles.photoLabel}>Upload your profile photo</ThemedText>
                        </>
                    )}
                </TouchableOpacity>

                {/* Bio */}
                <ThemedView style={styles.bioSection}>
                    <ThemedText style={styles.label}>Bio</ThemedText>
                    <TextInput
                        placeholder="Describe yourself"
                        placeholderTextColor="#555"
                        style={styles.bioInput}
                        value={bio}
                        onChangeText={text => text.length <= BIO_MAX_LENGTH && setBio(text)}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                    />
                    <ThemedText style={styles.charCount}>
                        {bio.length}/{BIO_MAX_LENGTH}
                    </ThemedText>
                </ThemedView>
            </ThemedView>

            <TouchableOpacity style={[styles.button, (!canFinish || loading) && styles.buttonDisabled]} onPress={handleFinish} activeOpacity={canFinish && !loading ? 0.8 : 1} >
                <ThemedText type="defaultSemiBold" style={styles.buttonText}>{loading ? 'Creating profile...' : 'Finish'}</ThemedText>
            </TouchableOpacity>
        
        </ParallaxScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 24,
        marginTop: 10,
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: 4,
    },

    // Photo picker
    photoWrapper: {
        alignItems: 'center',
        gap: 12,
    },
    photoDashed: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 2,
        borderColor: '#555',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    photo: {
        width: 130,
        height: 130,
        borderRadius: 65,
    },
    checkOverlay: {
        position: 'absolute',
        top: 0,
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoLabel: {
        color: '#888',
        fontSize: 13,
        marginTop: 4,
    },

    // Bio
    bioSection: {
        width: '100%',
        gap: 7,
    },
    label: {
        fontSize: 15,
    },
    bioInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 13,
        fontSize: 13,
        color: '#fff',
        minHeight: 120,
    },
    charCount: {
        textAlign: 'right',
        color: '#555',
        fontSize: 12,
    },

    button: {
        backgroundColor: '#59d386ff',
        padding: 14,
        borderRadius: 100,
        alignItems: 'center',
        marginTop: 5,
    },
    buttonDisabled: {
        backgroundColor: '#2a6b42',
        opacity: 0.5,
    },
    buttonText: {
        textAlign: 'center',
        color: '#fff',
    },
});