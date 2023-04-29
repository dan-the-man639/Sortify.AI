import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Button,
  Input,
  Card,
  Overlay,
} from 'react-native-elements';
import { Camera } from 'expo-camera';
import * as Permissions from 'expo-permissions';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

import * as jpeg from 'jpeg-js';

export default function App() {
  const modelLocation = FileSystem.documentDirectory + 'model/model.json';
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [isTfReady, setIsTfReady] = useState(false);
  const [customModel, setCustomModel] = useState(null);
  const [prediction, setPrediction] = useState({
    label: 'No Results',
    confidence: {},
  });
  const [status, setStatus] = useState('Preparing Model...');
  const [isLoading, setIsLoading] = useState(true);

  // Load TensorFlow
  useEffect(() => {
    async function startup() {
      if (!isTfReady) {
        console.log('[+] Loading TF Model');
        setStatus('Loading Model...');
        setIsLoading(true);
        let { status } = await Permissions.askAsync(
          Permissions.CAMERA,
          Permissions.CAMERA_ROLL
        );
        setHasPermission(status === 'granted');
        console.log('[+] Permission granted');
        await tf.ready();
        setIsTfReady(true);
        setCustomModel(await tf.loadLayersModel(modelLocation));
        setIsLoading(false);
        console.log('[+] TF Model Loaded');
      }
      setIsLoading(false);
    }
    startup();
  }, [isTfReady]);

  const getPredictions = async () => {
    console.log('[+] Analysing Photo');
    setStatus('Analysing Photo...');
    setIsLoading(true);
    try {
      if (this.camera) {
        let photo = await this.camera.takePictureAsync({
          skipProcessing: true,
        });
        // Resize images to width:224 height:224
        let image = await resizeImage(photo.uri, 224, 224);
        let imageTensor = base64ImageToTensor(image.base64);
        // Get predictions from custom model
        let predictions = await customModel.predict(imageTensor.expandDims(0));
        let topPrediction = predictions.argMax(-1).dataSync()[0];
        setPrediction({ label: `Class ${topPrediction}` });
      }
    } catch (e) {
      console.log('[-] No Camera', e);
      setIsLoading(false);
    }
    setIsLoading(false);
    console.log('[+] Photo Analysed');
  };

  function base64ImageToTensor(base64) {
    // Function to convert jpeg image to tensors
    const rawImageData = tf.util.encodeString(base64, 'base64');
    const TO_UINT8ARRAY = true;
    const { width, height, data } = jpeg.decode(rawImageData, TO_UINT8ARRAY);
    // Drop the alpha channel info for mobilenet
    const buffer = new Uint8Array
    (width * height * 3);
    let offset = 0; // offset into original data
    for (let i = 0; i < buffer.length; i += 3) {
      buffer[i] = data[offset];
      buffer[i + 1] = data[offset + 1];
      buffer[i + 2] = data[offset + 2];
      offset += 4;
    }
    return tf.tensor3d(buffer, [height, width, 3]);
  }

  const resizeImage = async (uri, width, height) => {
    // Function to resize the image
    const actions = [{ resize: { width, height } }];
    const manipulatorOptions = { format: 'jpeg', base64: true };
    const result = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      manipulatorOptions
    );
    return result;
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={type}
        ref={(ref) => {
          this.camera = ref;
        }}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={getPredictions}
            style={styles.captureButton}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <Text style={styles.text}>Capture</Text>
            )}
          </TouchableOpacity>
        </View>
      </Camera>
      <View style={styles.predictionContainer}>
        <Text style={styles.predictionText}>{prediction.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
  },
  captureButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 40,
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
  predictionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  predictionText: {
    fontSize: 20,
    color: 'white',
  },
});



