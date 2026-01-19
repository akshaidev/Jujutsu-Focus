import React, { useState } from "react";
import {
    StyleSheet,
    View,
    Modal,
    Pressable,
    Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "./ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";

interface BindingVowConfirmModalProps {
    visible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const animationConfig = {
    duration: 300,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

export function BindingVowConfirmModal({
    visible,
    onConfirm,
    onCancel,
}: BindingVowConfirmModalProps) {
    const [isAcknowledged, setIsAcknowledged] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const scale = useSharedValue(0.9);
    const opacity = useSharedValue(0);

    React.useEffect(() => {
        if (visible) {
            setIsModalVisible(true);
            setIsAcknowledged(false);
            scale.value = withTiming(1, animationConfig);
            opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) });
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handleClose = (callback: () => void) => {
        scale.value = withTiming(0.95, { duration: 200, easing: Easing.in(Easing.quad) });
        opacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) }, () => {
            runOnJS(callback)();
            runOnJS(setIsModalVisible)(false);
        });
    };

    const handleConfirm = () => {
        if (isAcknowledged) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            handleClose(onConfirm);
        }
    };

    const handleCancel = () => {
        handleClose(onCancel);
    };

    const toggleAcknowledge = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsAcknowledged(!isAcknowledged);
    };

    const cursedRed = "#8B0000";
    const cursedBlack = "#0A0A0A";
    const bloodRed = "#DC143C";

    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={handleCancel}
        >
            <BlurView style={styles.backdrop} intensity={40} tint="dark">
                <Animated.View style={[styles.modalContainer, animatedStyle]}>
                    {/* Dark cursed background */}
                    <View style={[styles.modalContent, { backgroundColor: cursedBlack }]}>
                        {/* Close button */}
                        <Pressable style={styles.closeButton} onPress={handleCancel}>
                            <Feather name="x" size={20} color="#666" />
                        </Pressable>

                        {/* Cursed icon */}
                        <View style={[styles.iconContainer, { backgroundColor: "rgba(139, 0, 0, 0.2)" }]}>
                            <Feather name="alert-triangle" size={32} color={bloodRed} />
                        </View>

                        {/* Title */}
                        <ThemedText style={[styles.title, { color: bloodRed }]}>
                            Binding Vow
                        </ThemedText>

                        {/* Warning text */}
                        <View style={[styles.textContainer, { borderColor: cursedRed }]}>
                            <ThemedText style={[styles.warningText, { color: "#E8E8E8" }]}>
                                "I acknowledge and accept that should I fail to erase my debt
                                within the next 24 hours, the vow shall recoil upon me. My debt
                                will increase by the greater of my original or current debt amount,
                                and I shall be forbidden from signing another vow for 6 hours."
                            </ThemedText>
                        </View>

                        {/* Checkbox */}
                        <Pressable style={styles.checkboxRow} onPress={toggleAcknowledge}>
                            <View
                                style={[
                                    styles.checkbox,
                                    {
                                        borderColor: isAcknowledged ? bloodRed : "#444",
                                        backgroundColor: isAcknowledged ? bloodRed : "transparent",
                                    },
                                ]}
                            >
                                {isAcknowledged && (
                                    <Feather name="check" size={14} color="#FFF" />
                                )}
                            </View>
                            <ThemedText style={[styles.checkboxLabel, { color: "#AAA" }]}>
                                I accept the terms of this binding vow
                            </ThemedText>
                        </Pressable>

                        {/* Sign button */}
                        <Pressable
                            style={[
                                styles.signButton,
                                {
                                    backgroundColor: isAcknowledged ? bloodRed : "#333",
                                    opacity: isAcknowledged ? 1 : 0.5,
                                },
                            ]}
                            onPress={handleConfirm}
                            disabled={!isAcknowledged}
                        >
                            <Feather
                                name="feather"
                                size={18}
                                color={isAcknowledged ? "#FFF" : "#666"}
                            />
                            <ThemedText
                                style={[
                                    styles.signButtonText,
                                    { color: isAcknowledged ? "#FFF" : "#666" },
                                ]}
                            >
                                Sign the Vow
                            </ThemedText>
                        </Pressable>
                    </View>
                </Animated.View>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: "90%",
        maxWidth: 360,
    },
    modalContent: {
        borderRadius: BorderRadius.xl,
        padding: Spacing["2xl"],
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(139, 0, 0, 0.4)",
        ...Platform.select({
            ios: {
                shadowColor: "#8B0000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    closeButton: {
        position: "absolute",
        top: Spacing.md,
        right: Spacing.md,
        padding: Spacing.xs,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: Spacing.lg,
        letterSpacing: 0.5,
    },
    textContainer: {
        borderLeftWidth: 2,
        paddingLeft: Spacing.md,
        marginBottom: Spacing.xl,
    },
    warningText: {
        fontSize: 14,
        lineHeight: 22,
        fontStyle: "italic",
        textAlign: "left",
    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
        alignSelf: "flex-start",
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxLabel: {
        fontSize: 13,
        flex: 1,
    },
    signButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing["2xl"],
        borderRadius: BorderRadius.lg,
        width: "100%",
    },
    signButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
});
