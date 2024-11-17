import React, { useEffect, useState } from 'react';
import { View, Button, Text, StyleSheet, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

// Definir la interfaz para las lecturas
interface Lectura {
  sensor: string;
  valor: number;
  fecha: string;
}

const ReporteScreen = () => {
  const [lecturas, setLecturas] = useState<Lectura[]>([]);

  // Obtener las lecturas desde la API
  const fetchLatestReadings = async () => {
    try {
      const response = await axios.get('https://api-control-motor.onrender.com/api/lecturas');
      setLecturas(response.data);
    } catch (error) {
      console.error('Error al obtener las lecturas:', error);
    }
  };

  useEffect(() => {
    fetchLatestReadings(); // Obtener las lecturas cuando el componente se monte
  }, []);

  // Generar el contenido HTML para el PDF
  const generateHtmlContent = (lecturas: Lectura[]) => {
    let html = `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 20px;">
          <h1 style="text-align: center;">Reporte de Sensor</h1>
          <table border="1" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr>
                <th>Sensor</th>
                <th>Valor</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
    `;
    lecturas.forEach(({ sensor, valor, fecha }) => {
      html += `
        <tr>
          <td>${sensor}</td>
          <td>${valor}</td>
          <td>${fecha}</td>
        </tr>
      `;
    });
    html += `
            </tbody>
          </table>
        </body>
      </html>
    `;
    return html;
  };

  // Manejar la generación del reporte
  const handleGenerateReport = async () => {
    if (lecturas.length === 0) {
      Alert.alert('No hay datos', 'No se pudieron obtener las lecturas.');
      return;
    }

    const htmlContent = generateHtmlContent(lecturas);
    try {
      // Generar el PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      const pdfUri = `${FileSystem.documentDirectory}reporte_sensor.pdf`;
      await FileSystem.moveAsync({
        from: uri,
        to: pdfUri,
      });

      // Compartir el PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri);
      } else {
        Alert.alert('Compartir no disponible', `El PDF se guardó en: ${pdfUri}`);
      }
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      Alert.alert('Error', 'Hubo un problema al generar el reporte.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generar Reporte PDF</Text>
      <Button title="Generar Reporte" onPress={handleGenerateReport} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
});

export default ReporteScreen;
