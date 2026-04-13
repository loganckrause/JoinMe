import { StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

import Sidebar from "@/components/ui/sidebar";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';


export default function CrtEvntScreen() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const route = useRoute();
    const { event } = route.params || {};
    const [count, setCount] = useState(2);

    const MAX_SELECTIONS = 5;
    const [selected, setSelected] = useState<string[]>([]);
    const toggle = (id: string) => {
        setSelected(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            }
            if (prev.length >= MAX_SELECTIONS) return prev;
            return [...prev, id];
        });
    };

    const [eventName, setEventName] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const interests = [
        { id: '1', label: 'Exercise' },
        { id: '2', label: 'Sport' },
        { id: '3', label: 'Indoor' },
        { id: '4', label: 'Coffee' },
    ]

    const [photoUri, setPhotoUri] = useState<string | null>(null);
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
    return(
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#fff', dark: '#0a0a0bff'}}
        >
            <ThemedView style={styles.container}>
                <TouchableOpacity onPress={() => setSidebarOpen(true)}>
                    <IconSymbol name="line.3.horizontal" color="#fff" size={30} />
                </TouchableOpacity>
                <ThemedText style={styles.title}>Create Event</ThemedText>
                <TouchableOpacity style={styles.photoWrapper} onPress={pickImage} activeOpacity={0.8}>
                    {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.photo} />
                    ) : (
                        <ThemedView style={styles.photoDashed}>
                            <IconSymbol name="camera" color="#888" size={60} />
                        </ThemedView>
                    )}
                </TouchableOpacity>
                <ThemedText style={styles.t2}>Event Name</ThemedText>
                <ThemedView style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={eventName}
                        onChangeText={setEventName}
                        editable={!loading}
                    />
                </ThemedView>
                <ThemedText style={styles.t2}>Location</ThemedText>
                <ThemedView style={styles.inputContainer2}>
                    <TextInput
                        placeholder="Add a place or address"
                        placeholderTextColor='#ccc'
                        style={styles.input}
                        value={location}
                        onChangeText={setLocation}
                        editable={!loading}
                    />
                    <ThemedView style={styles.locimg}>
                        <IconSymbol name="mappin.and.ellipse" color="#ffffffff" size={20} />
                    </ThemedView>
                </ThemedView>
                <ThemedView style={styles.t2row}>
                    <ThemedText style={styles.t2}>Date</ThemedText>
                    <ThemedText style={styles.t2}>Time</ThemedText>
                </ThemedView>
                <ThemedView style={styles.inputRow}>
                    <ThemedView style={styles.smallIC}>
                        <TextInput
                            placeholder="mm/dd/yyyy"
                            placeholderTextColor='#ccc'
                            style={styles.input}
                            value={date}
                            onChangeText={setDate}
                            editable={!loading}
                        />
                        <ThemedView style={styles.locimg}>
                            <IconSymbol name="calendar" color="#ffffffff" size={20} />
                        </ThemedView>
                    </ThemedView>
                    <ThemedView style={styles.smallIC}>
                        <TextInput
                            style={styles.input}
                            value={time}
                            onChangeText={setTime}
                            editable={!loading}
                        />
                        <ThemedView style={styles.locimg}>
                            <IconSymbol name="clock" color="#ffffffff" size={20} />
                        </ThemedView>
                    </ThemedView>
                </ThemedView>
                <ThemedText style={styles.t2}>Description</ThemedText>
                <ThemedView style={styles.inputContainerd}>
                    <TextInput
                        placeholder="What should people expect? Mention any important details."
                        placeholderTextColor='#ccc'
                        style={styles.input}
                        multiline
                        numberOfLines={10}
                        value={description}
                        onChangeText={setDescription}
                        editable={!loading}
                    />
                </ThemedView>
                <ThemedText style={styles.t2}>Interests</ThemedText>
                <ThemedView style={styles.pillsContainer}>
                    {interests.map(item => {
                        const isSelected = selected.includes(item.id);
                            return (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => toggle(item.id)}
                                style={[
                                    styles.pill,
                                    isSelected && styles.pillSelected,
                                ]}
                                activeOpacity={0.7}
                            >
                                <ThemedText
                                    style={[
                                        styles.pillText,
                                    isSelected && styles.pillTextSelected,
                                    ]}
                                >
                                    {item.label}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    })}
                    <TouchableOpacity style={styles.addPill}>
                        <ThemedText style={styles.addTxt}>+</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
                <ThemedText style={styles.t2}>Participants</ThemedText>
                <ThemedView style={styles.inputContainerC}>
                    <TextInput
                        placeholder="2"
                        style={styles.cInput}
                        value={String(count)}
                    />
                    <ThemedView style={styles.buttRow}>
                        <TouchableOpacity style={styles.moreButt}
                            onPress={() => setCount(count + 1)}
                            style={styles.moreButt}
                            >
                            <IconSymbol name="plus" color="#fff" size={24} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setCount(Math.max(2, count - 1))}
                            style={styles.lessButt}
                            >
                            <IconSymbol name="minus" color="#fff" size={24} />
                        </TouchableOpacity>
                    </ThemedView>
                </ThemedView>
                <Sidebar
                    visible={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    user={{ name: "John Doe", photoUri: null }} // Define user here or as a variable
                />
            </ThemedView>
            <TouchableOpacity style={styles.butt}>
                <ThemedText style={styles.buttText}>Publish Event</ThemedText>
            </TouchableOpacity>
            
        </ParallaxScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        top: -30,
    },
    photoWrapper: {
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#888',
        width: 140,
        height: 125,
        marginTop: 20,
        backgroundColor: '#161617ff',
        overflow: 'hidden',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    photoDashed: {
         backgroundColor: 'transparent',
    },
    title: {
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 25,
    },
    t2: {
        fontWeight: '400',
        marginTop: 10,
        marginBottom: 10,
    },
    t2row: {
        flexDirection: 'row',
        justifyContent: 'left',
        gap: 135,
    },
    inputContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        position: 'relative',
    },
    inputContainer2: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        position: 'relative',
        paddingLeft: 35,
    },
    inputContainerd: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        position: 'relative',
        textAlignVertical: 'top',
        height: 125,
    },
    input: {
        justifyContent: 'center',
        fontSize: 16,
        color: '#fff',
    },
    inputRow: {
        flexDirection: 'row',
        gap: 15,
        justifyContent: 'center',
    },
    smallIC: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        width: 155,
        paddingLeft: 35,
    },
    bA: {
        fontSize: 35,
        lineHeight: 35,
        color: '#fff',
    },
    locimg: {
        position: 'absolute',
        top: '45%',
        left: 8,
    },
    butt: {
        backgroundColor: '#59d386ff',
        padding: 14,
        borderRadius: 100,
        alignItems: 'center',
        marginTop: 5,
    },
    buttText: {
        color: '#000000ff',
    },
    buttRow: {
        flexDirection: 'row',
        left: 10,
        paddingRight: 10,
    },
    pillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'left',
    },
    pill: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingVertical: 7,
        width: 100,
        alignItems: 'center',
        
    },
    addPill: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingVertical: 7,
        width: 100,
        alignItems: 'center',
        width: 40,
    },
    addTxt: {
        color: '#59d386ff',
    },
    pillSelected: {
        borderColor: '#59d386ff',
        backgroundColor: 'transparent',
    },
    pillText: {
        color: '#fff',
        fontSize: 14,
    },
    cInput: {
        color: '#ccc',
        fontSize: 20,
    },
    inputContainerC: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        position: 'relative',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});
