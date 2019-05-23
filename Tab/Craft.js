import React from "react";
import {
  ActivityIndicator,
  Clipboard,
  Image,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert
} from "react-native";
import { Icon, Button, Item } from "native-base";
import { Constants, ImagePicker, Permissions } from "expo";
import uuid from "uuid";
import * as firebase from "firebase";
import { db } from "../Config.js";

console.disableYellowBox = true;

let addItem = (link, desc) => {
  db.ref("/items").push({
    imgURL: link,
    description: desc,
    created_at: Date.now()
  });
};

class AddNewScreen extends React.Component {
  static navigationOptions = {
    tabBarIcon: ({ tintColor }) => (
      <Icon name="ios-add-circle" style={{ color: tintColor }} />
    )
  };

  state = {
    description: "",
    image: null,
    uploading: false
  };
  async componentDidMount() {
    await Permissions.askAsync(Permissions.CAMERA_ROLL);
    await Permissions.askAsync(Permissions.CAMERA);
  }

  render() {
    let { image } = this.state;

    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {image ? null : (
          <Text
            style={{
              fontSize: 20,
              marginBottom: 20,
              textAlign: "center",
              marginHorizontal: 15
            }}
          />
        )}
        <Item>
          <Button onPress={this._pickImage}>
            <Icon transparent active name="image" />
          </Button>
        </Item>

        <Text style={{ marginBottom: 20, marginTop: 20 }} />
        <Item>
          <Button onPress={this._takePhoto}>
            <Icon transparent active name="camera" />
          </Button>
        </Item>

        {this._maybeRenderImage()}

        <StatusBar barStyle="default" />
      </View>
    );
  }

  handleChange = e => {
    this.setState({
      description: e.nativeEvent.text
    });
  };
  handleSubmit = () => {
    addItem(this.state.image, this.state.description);
    Alert.alert(
      "Post Status",
      "Successfully Saved !",
      [
        {
          text: "OK",
          onPress: () => this.props.navigation.navigate("Feed")
        }
      ],
      { cancelable: false }
    );
  };

  _maybeRenderImage = () => {
    let { image } = this.state;
    if (!image) {
      return;
    }
    descriptionHand = String => {
      this.setState({ description: String });
    };

    return (
      <View
        style={{
          marginTop: 30,
          width: 400,
          borderRadius: 3,
          elevation: 2
        }}
      >
        <View
          style={{
            borderTopRightRadius: 3,
            borderTopLeftRadius: 3,
            shadowColor: "rgba(0,0,0,1)",
            shadowOpacity: 0.2,
            shadowOffset: { width: 4, height: 4 },
            shadowRadius: 5,
            overflow: "hidden"
          }}
        >
          <Image
            source={{ uri: image }}
            style={{
              width: 400,
              height: 200,
              resizeMode: "contain"
            }}
          />
        </View>

        <Text style={{ marginTop: 20, marginBottom: 20 }}>Description :</Text>

        <TextInput
          onChange={this.handleChange}
          multiline={true}
          numberOfLines={4}
          placeholder="Description"
          style={{
            paddingLeft: 10,
            width: 400,
            borderColor: "transparent",
            borderWidth: 1,
            backgroundColor: "rgba(210, 215, 211, 0.3)",
            marginBottom: 20
          }}
        />
        <Item style={{ justifyContent: "center" }}>
          <Button onPress={this.handleSubmit}>
            <Icon placeholder="Post" transparent active name="paper-plane" />
          </Button>
        </Item>
      </View>
    );
  };
  _share = () => {
    Share.share({
      message: this.state.image,
      title: "Check out this photo",
      url: this.state.image
    });
  };

  _takePhoto = async () => {
    let pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 4]
    });

    this._handleImagePicked(pickerResult);
  };

  _pickImage = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 4]
    });

    this._handleImagePicked(pickerResult);
  };

  _handleImagePicked = async pickerResult => {
    try {
      this.setState({ uploading: true });

      if (!pickerResult.cancelled) {
        uploadUrl = await uploadImageAsync(pickerResult.uri);
        this.setState({ image: uploadUrl });
      }
    } catch (e) {
      console.log(e);
      alert("Upload failed, sorry :(");
    } finally {
      this.setState({ uploading: false });
    }
    <Text>Loading...</Text>;
  };
}

async function uploadImageAsync(uri) {
  // Why are we using XMLHttpRequest? See:
  // https://github.com/expo/expo/issues/2402#issuecomment-443726662
  const blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      resolve(xhr.response);
    };
    xhr.onerror = function(e) {
      console.log(e);
      reject(new TypeError("Network request failed"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });

  const ref = firebase
    .storage()
    .ref()
    .child(uuid.v4());
  const snapshot = await ref.put(blob);

  // We're done with the blob, close and release it
  blob.close();

  return await snapshot.ref.getDownloadURL();
}

export default AddNewScreen;