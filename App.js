import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Modal,
  Text,
  Image,
  ActivityIndicator,
} from "react-native";

import {
  getModel,
  convertBase64ToTensor,
  startPrediction,
} from "./helpers/tensor-helper";
import { cropPicture } from "./helpers/image-helper";

import Icon from 'react-native-vector-icons/FontAwesome'
import IconMCI from 'react-native-vector-icons/MaterialCommunityIcons'
import takephotobutton from "./images/takephotobutton.png";

import { Camera } from "expo-camera";

const RESULT_MAPPING = ["Compost", "Recyclable", "Garbage"];

export default function App() {
  const cameraRef = useRef();
  const [isProcessing, setIsProcessing] = useState(false);
  const [presentedShape, setPresentedShape] = useState("");

  const handleImageCapture = async () => {
    setIsProcessing(true);
    const imageData = await cameraRef.current.takePictureAsync({
      base64: true,
    });
    processImagePrediction(imageData);
  };

  const processImagePrediction = async (base64Image) => {
    const croppedData = await cropPicture(base64Image, 300);
    const model = await getModel();
    const tensor = await convertBase64ToTensor(croppedData.base64);

    const prediction = await startPrediction(model, tensor);

    const highestPrediction = prediction.indexOf(
      Math.max.apply(null, prediction)
    );
    setPresentedShape(RESULT_MAPPING[highestPrediction]);
  };

  return (
    <View style={styles.container}>
      <Modal visible={isProcessing} transparent={true} animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.thisgoesin}>This item is...</Text>
            {/* <Text style={styles.category}>{presentedShape}</Text> */}
            {presentedShape === "Recyclable" ? (
              <View style={styles.categoryContainer}>
                <Icon name="recycle" size={50} color="#065FB1" />
                <Text style={[{ color: "#065FB1" }, styles.category]}>Recyclable</Text>
              </View>
            ) : presentedShape === "Garbage" ? (
              <View style={styles.categoryContainer}>
                <Icon name="trash" size={50} color="#898987" />
                <Text style={[{ color: "#898987", marginTop: 5 }, styles.category]}>Garbage</Text>
              </View>
            ) : (
              <View style={styles.categoryContainer}>
                <IconMCI name="food-apple" size={50} color="#61D94C" />
                <Text style={[{ color: "#61D94C", marginTop: 5 }, styles.category]}>Compostable</Text>
              </View>
            )}

            {/* {presentedShape === "" && <ActivityIndicator size="large" />} */}
            <Pressable
              style={styles.dismissButton}
              onPress={() => {
                setPresentedShape("");
                setIsProcessing(false);
              }}
            >
              <Text style={styles.dismissText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={Camera.Constants.Type.back}
        autoFocus={true}
        whiteBalance={Camera.Constants.WhiteBalance.auto}
      ></Camera>

      {/* <TouchableOpacity 
        title="Predict"
        onPress={()=>{handleImageCapture()}}
        type="outline"
        style={styles.captureButton}
      >
        <Image source={takephotobutton}  style={styles.img}/>
      </TouchableOpacity> */}

      <Pressable
        onPress={() => handleImageCapture()}
        style={styles.captureButton}
      >
        <Image source={takephotobutton}  style={styles.img}/>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  captureButton: {
    position: "absolute",
    left: Dimensions.get("screen").width / 2 - 50,
    bottom: 40,
    width: 80,
    height: 80,
    zIndex: 100,
    // backgroundColor: "white",
    borderRadius: 100,
  },
  modal: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    alignItems: "center",
    // justifyContent: "center",
    width: 300,
    height: 300,
    borderRadius: 24,
    backgroundColor: "black",
    opacity: 0.8
  },
  dismissButton: {
    width: 150,
    height: 50,
    marginTop: 45,
    borderRadius: 24,
    color: "white",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "red",
  },
  dismissText: {
    fontSize: 20
  },
  thisgoesin: {
    fontSize: 25,
    padding: 20,
    marginTop: 30,
    fontWeight: 'bold',
    fontFamily: "Roboto",
    color: '#FFFFFF'
  },
  category: {
    fontSize: 30,
    marginLeft: 10,
    fontWeight: 'bold'
  },
  categoryContainer: {
    paddingTop: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    // alignContent: 'center'
    height: 60,
    // borderColor: 'red',
    // borderWidth: 2
  },

});