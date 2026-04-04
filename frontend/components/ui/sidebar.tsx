import { StyleSheet,TouchableOpacity, TouchableWithoutFeedback, Modal,  Animated, Image, Dimensions} from 'react-native';
import { useEffect, useRef } from 'react';
import { router, usePathname } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/store/auth';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.70;

type SidebarProps = {
    visible: boolean;
    onClose: () => void;
    user: {
        name: string;
        photoUri?: string | null;
    };
};

type MenuItemProps = {
    icon: string;
    label: string;
    onPress: () => void;
    active?: boolean;
};

function MenuItem({ icon, label, onPress, active }: MenuItemProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.menuItem, active && styles.menuItemActive]}
            activeOpacity={0.7}
        >
            <IconSymbol name={icon} color={active ? '#fff' : '#aaa'} size={25} />
            <ThemedText style={[styles.menuLabel, active && styles.menuLabelActive]}>
                {label}
            </ThemedText>
        </TouchableOpacity>
    );
}

export default function Sidebar({ visible, onClose, user }: SidebarProps) {

    const logout = useAuthStore(state => state.logout);
    const pathname = usePathname();
    const handleLogout = () => {
        logout();                       
        router.replace('/(auth)');       
    };

    const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: visible ? 0 : -SIDEBAR_WIDTH,
            duration: 280,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    const navigate = (route: string) => {
        onClose();

        // No change if already on this route
        if (route === pathname) {
            return;
        }
    
        router.replace(route as any);    
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            {/* Dim backdrop */}
            <TouchableWithoutFeedback onPress={onClose}>
                <ThemedView style={styles.backdrop} />
            </TouchableWithoutFeedback>

            {/* Sliding panel */}
            <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>

                <ThemedView style={styles.header}>
                    <TouchableOpacity onPress={() => navigate('/user-profile')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <ThemedView style={styles.userInfo} >
                        {user.photoUri ? (
                            <Image source={{ uri: user.photoUri }} style={styles.avatar} />
                        ) : (
                            <ThemedView style={styles.avatarPlaceholder}>
                                <IconSymbol name="person.fill" color="#888" size={24}  />
                            </ThemedView>
                        )}
                        <ThemedText type="defaultSemiBold" style={styles.userName}>
                            {user.name}
                        </ThemedText>
                    </ThemedView>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <IconSymbol name="xmark" color="#fff" size={18} />
                    </TouchableOpacity>
                </ThemedView>

                {/* Divider */}
                <ThemedView style={styles.divider} />

                {/* Menu items */}
                <ThemedView style={styles.menuContainer}>
                <ThemedView style={styles.menu}>
                    <MenuItem
                        icon="safari"
                        label="Feed"
                        active={pathname === '/feed'}
                        onPress={() => navigate('/feed')}
                    />
                    <MenuItem
                        icon="checkmark.circle"
                        label="Accepted Events"
                        active={pathname === '/accepted-events'}
                        onPress={() => navigate('/accepted-events')}
                    />
                    <MenuItem
                        icon="message"
                        label="Messages"
                        active={pathname === '/messages'}
                        onPress={() => navigate('/messages')}
                    />
                    <MenuItem
                        icon="calendar"
                        label="All Events"
                        active={pathname === '/all-events'}
                        onPress={() => navigate('/all-events')}
                    />
                    <MenuItem
                        icon="plus"
                        label="Organize New Event"
                        active={pathname === '/organize-event'}
                        onPress={() => navigate('/organize-event')}

                    />
                </ThemedView>
                <ThemedView style={styles.menu}>
                    <MenuItem
                        icon="rectangle.portrait.and.arrow.right"
                        label="Logout"
                        onPress={handleLogout}
                    />
                </ThemedView>
                 </ThemedView>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    sidebar: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        backgroundColor: '#0f0f10',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'transparent',
        marginBottom: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'transparent',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#2a2a2a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userName: {
        fontSize: 16,
        color: '#fff',
    },

    divider: {
        height: 1,
        backgroundColor: '#2a2a2a',
        marginBottom: 12,
    },
    menu: {
        gap: 4,
        backgroundColor: 'transparent',

    },
    menuContainer: {
        flex: 1,                       
        justifyContent: 'space-between',
        backgroundColor: 'transparent',

    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 10,
    },
    menuItemActive: {
        backgroundColor: '#1e1e1eff',
    },
    menuLabel: {
        fontSize: 15,
        color: '#aaa',
    },
    menuLabelActive: {
        color: '#fff',
    },
});