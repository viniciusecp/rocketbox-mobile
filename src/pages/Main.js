import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';

import api from '../services/api';

import logo from '../assets/logo.png';

export default function Box({navigation}) {
  const [boxName, setBoxName] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('box').then(box => {
      if (box) {
        navigation.navigate('Box', {box});
      }
    });
  }, []);

  async function handleSignIn() {
    const response = await api.post(`/boxes`, {
      title: boxName,
    });

    const {_id} = response.data;

    await AsyncStorage.setItem('box', _id);

    navigation.navigate('Box', {box: _id});
  }

  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={logo} />

      <TextInput
        style={styles.input}
        placeholder="Crie um box"
        placeholderTextColor="#999"
        autoCapitalize="none"
        autoCorrect={false}
        underlineColorAndroid="transparent"
        value={boxName}
        onChangeText={text => setBoxName(text)}
      />

      <TouchableOpacity onPress={handleSignIn} style={styles.button}>
        <Text style={styles.buttonText}>Criar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 30,
  },

  logo: {
    alignSelf: 'center',
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    fontSize: 16,
    paddingHorizontal: 20,
    marginTop: 20,
  },

  button: {
    height: 48,
    borderRadius: 4,
    paddingHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#7159c1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
});
