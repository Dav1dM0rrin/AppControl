import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Button } from 'react-native';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';  // Importamos expo-sharing para compartir archivos

const API_URL = 'https://api-control-motor.onrender.com';

// Definir la interfaz para los datos de las lecturas
interface Lectura {
    id_lectura: number;
    valor_salida: number;
    fecha_hora: string;
    id_sensor: number;
    id_usuario: number;
}

export default function ReportesScreen() {
    const [lecturas, setLecturas] = useState<Lectura[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fileUri, setFileUri] = useState<string | null>(null); // Para guardar la URI del archivo descargado
    const { token } = useLocalSearchParams();

    useEffect(() => {
        const fetchLecturas = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/lecturas`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setLecturas(response.data);  // Guarda las lecturas recibidas de la API
            } catch (error) {
                setError('Error al cargar los datos');
                Alert.alert('Error', 'No se pudieron cargar las lecturas');
            } finally {
                setLoading(false);
            }
        };

        fetchLecturas();
    }, [token]);

    const renderItem = ({ item }: { item: Lectura }) => (
        <View style={styles.item}>
            <Text style={styles.text}>ID Lectura: {item.id_lectura}</Text>
            <Text style={styles.text}>Valor de salida: {item.valor_salida}</Text>
            <Text style={styles.text}>Fecha y Hora: {item.fecha_hora}</Text>
            <Text style={styles.text}>ID Sensor: {item.id_sensor}</Text>
            <Text style={styles.text}>ID Usuario: {item.id_usuario}</Text>
        </View>
    );

    // Función para generar el archivo de texto y guardarlo en el almacenamiento local
    const downloadTxtFile = async () => {
        try {
            // Crear el contenido del archivo
            let content = 'ID Lectura, Valor de Salida, Fecha y Hora, ID Sensor, ID Usuario\n';
            lecturas.forEach((lectura) => {
                content += `${lectura.id_lectura}, ${lectura.valor_salida}, ${lectura.fecha_hora}, ${lectura.id_sensor}, ${lectura.id_usuario}\n`;
            });

            // Guardar el archivo en el sistema de archivos de la app
            const fileUri = FileSystem.documentDirectory + 'lecturas_sensores.txt';
            await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });

            setFileUri(fileUri); // Guardar la URI del archivo generado
            Alert.alert('Éxito', `El archivo se ha guardado en: ${fileUri}`);

        } catch (error) {
            console.error('Error al guardar el archivo:', error);
            Alert.alert('Error', 'No se pudo guardar el archivo');
        }
    };

    // Función para compartir el archivo utilizando expo-sharing
    const shareFile = async () => {
        if (fileUri) {
            try {
                await Sharing.shareAsync(fileUri); // Compartir el archivo
            } catch (error) {
                console.error('Error al compartir el archivo:', error);
                Alert.alert('Error', 'No se pudo compartir el archivo');
            }
        } else {
            Alert.alert('Error', 'No hay archivo para compartir');
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Reporte de Lecturas de Sensores</Text>
            {error ? (
                <Text style={styles.error}>{error}</Text>
            ) : (
                <FlatList
                    data={lecturas}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id_lectura.toString()}
                />
            )}
            <Button title="Descargar Reporte TXT" onPress={downloadTxtFile} />
            {fileUri && (
                <View>
                    <Text style={styles.fileUri}>Archivo guardado en: {fileUri}</Text>
                    <Button title="Compartir Reporte" onPress={shareFile} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
    },
    item: {
        marginBottom: 15,
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        borderColor: '#ddd',
        borderWidth: 1,
    },
    text: {
        fontSize: 16,
    },
    error: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
    },
    fileUri: {
        marginTop: 20,
        fontSize: 14,
        color: 'green',
        textAlign: 'center',
    },
});