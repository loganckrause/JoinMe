import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';

export function BackButton() {
    return (
        <TouchableOpacity
            onPress={() => router.back()}
            style={{ alignSelf: 'flex-start' }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
            <IconSymbol name="chevron.left" size={28} color="#fff" />
        </TouchableOpacity>
    );
}
