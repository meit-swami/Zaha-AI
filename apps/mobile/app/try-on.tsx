import React, { useState } from 'react';
import { StyleSheet, View as RNView, Text as RNText, TextInput as RNTextInput, TouchableOpacity as RNTouchableOpacity, Platform, ActivityIndicator as RNActivityIndicator } from 'react-native';
const View = RNView as any;
const Text = RNText as any;
const TextInput = RNTextInput as any;
const TouchableOpacity = RNTouchableOpacity as any;
const ActivityIndicator = RNActivityIndicator as any;
import { WebView as RNWebView } from 'react-native-webview';
const WebView = RNWebView as any;
import { useLocalSearchParams } from 'expo-router';

/**
 * TryOnScreen Component
 * Facilitates the connection between the Mobile App and the Web-based AR Engine.
 */
export default function TryOnScreen() {
    // Default to localhost for web/simulator. Change this in the UI for physical devices.
    const [ip, setIp] = useState("localhost");
    const [connected, setConnected] = useState(false);

    // Extract parameters from router
    const params = useLocalSearchParams();
    const type = params.type as 'jewelry' | 'apparel' | undefined;
    const image = params.image as string | undefined;

    const arUrl = `http://${ip}:3000/ar-mirror?type=${type || 'jewelry'}&image=${encodeURIComponent(image || '')}`;

    // --- PLATFORM: WEB (Fallback/Internal Testing) ---
    if (Platform.OS === 'web') {
        if (!connected) {
            return (
                <View style={styles.container}>
                    <View style={styles.card}>
                        <Text style={styles.title}>Browser Preview</Text>
                        <Text style={styles.desc}>Enter the AR Host IP to launch the engine frame.</Text>
                        <TextInput
                            style={styles.input}
                            value={ip}
                            onChangeText={setIp}
                            placeholder="e.g. localhost"
                        />
                        <TouchableOpacity style={styles.button} onPress={() => setConnected(true)}>
                            <Text style={styles.btnText}>LAUNCH AR FRAME</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.webContainer}>
                <iframe
                    src={arUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="camera; microphone; accelerometer;"
                    title="AR Mirror Preview"
                />
            </View>
        );
    }

    // --- PLATFORM: NATIVE (iOS/Android) ---
    if (!connected) {
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.title}>Connect AR Mirror</Text>
                    <Text style={styles.desc}>Enter your PC's Local IP Address to sync the mobile camera with the AI Engine.</Text>

                    <TextInput
                        style={styles.input}
                        value={ip}
                        onChangeText={setIp}
                        placeholder="e.g. 192.168.1.5"
                        keyboardType="default" // Allow 'localhost' or IPs
                    />

                    <TouchableOpacity style={styles.button} onPress={() => setConnected(true)}>
                        <Text style={styles.btnText}>SYNC & LAUNCH</Text>
                    </TouchableOpacity>

                    <Text style={styles.hint}>Pro Tip: Run `ipconfig` on your PC to find your IPv4 Address.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.webContainer}>
            <WebView
                source={{ uri: arUrl }}
                style={styles.webview}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                originWhitelist={['*']}
                // Webview specific permissions for Camera
                onPermissionRequest={(request: any) => {
                    request.grant(request.resources);
                }}
                renderLoading={() => (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color="#C5A065" />
                        <Text style={styles.loadingText}>Initializing AI Engine...</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#004D40', // Deep Teal
        justifyContent: 'center',
        padding: 24
    },
    webContainer: {
        flex: 1,
        backgroundColor: '#000'
    },
    card: {
        backgroundColor: '#FFF',
        padding: 32,
        borderRadius: 32,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 10
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1A1A1A',
        marginBottom: 12,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-medium'
    },
    desc: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 24,
        lineHeight: 20,
        fontSize: 14
    },
    input: {
        backgroundColor: '#F3F4F6',
        width: '100%',
        padding: 18,
        borderRadius: 16,
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 24,
        color: '#000',
        fontWeight: 'bold',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    button: {
        backgroundColor: '#006D66',
        paddingVertical: 18,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#006D66',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20
    },
    btnText: {
        color: '#FFF',
        fontWeight: '900',
        letterSpacing: 2,
        fontSize: 14
    },
    hint: {
        marginTop: 24,
        color: '#9CA3AF',
        fontSize: 11,
        fontStyle: 'italic'
    },
    loading: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000'
    },
    loadingText: {
        color: '#C5A065',
        marginTop: 16,
        fontWeight: 'bold',
        letterSpacing: 2,
        fontSize: 12,
        textTransform: 'uppercase'
    },
    webview: {
        flex: 1
    }
});
