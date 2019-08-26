import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import ImagePicker from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import io from 'socket.io-client';

import {formatDistance} from 'date-fns';
import pt from 'date-fns/locale/pt';

import api from '../services/api';

import Icon from 'react-native-vector-icons/MaterialIcons';

export default function Box({navigation}) {
  const boxId = navigation.getParam('box');
  const [socketId, setSocketId] = useState(null);
  const [box, setBox] = useState({});
  const [dataReceived, setDataReceived] = useState(null);

  useEffect(() => {
    async function loadBoxes() {
      const response = await api.get(`/boxes/${boxId}`);

      setBox(response.data);
    }

    loadBoxes();
  }, [boxId]);

  useEffect(() => {
    const socket = io('https://rocketbox-b.herokuapp.com');

    socket.on('connect', () => {
      setSocketId(socket.id);

      socket.emit('connectRoom', boxId);

      socket.on('file', data => setDataReceived({...data, type: 'newFile'}));

      socket.on('deleteFile', data =>
        setDataReceived({...data, type: 'deleteFile'}),
      );
    });
  }, [boxId]);

  useEffect(() => {
    if (dataReceived) {
      // if (dataReceived.socketId === socketId) return; // aqui não precisa, pq só apresenta o file depois do upload ter dado certo

      if (dataReceived.type === 'newFile') {
        setBox({...box, files: [dataReceived.file, ...box.files]});
      } else if (dataReceived.type === 'deleteFile') {
        const files = box.files.filter(
          file => file._id !== dataReceived.file._id,
        );
        setBox({...box, files});
      }

      setDataReceived(null);
    }
  }, [dataReceived, box]);

  async function openFile(file) {
    try {
      const filePath = `${RNFS.DocumentDirectoryPath}/${file.title}`; // é o caminho onde pode salvar arquivos no celular
      console.debug(filePath);
      await RNFS.downloadFile({
        fromUrl: file.url,
        toFile: filePath,
      }); // baixa o arquivo a partir da url e salva no dispositivo

      await FileViewer.open(filePath); // manda abri o arquivo
    } catch (err) {
      Alert.alert('Atenção', 'Este tipo de arquivo não é suportado!');
    }
  }

  function handleUpload() {
    ImagePicker.launchImageLibrary({}, async upload => {
      if (upload.error) {
        console.debug('ImagePicker error');
      } else if (upload.didCancel) {
        console.debug('Canceled by user');
      } else {
        const data = new FormData();

        const [prefix, suffix] = upload.fileName.split('.');
        const ext = suffix.toLowerCase() === 'heic' ? 'jpg' : suffix;

        data.append('file', {
          uri: upload.uri,
          type: upload.type,
          name: `${prefix}.${ext}`,
        });

        api.post(`/boxes/${boxId}/files`, data, {
          headers: {socketId},
        });
      }
    });
  }

  async function handleDeleteFile(fileId) {
    await api.delete(`/boxes/${boxId}/files/${fileId}`, {
      headers: {socketId},
    });

    const files = box.files.filter(file => file._id !== fileId);

    setBox({...box, files});
  }

  async function handleLogout() {
    await AsyncStorage.clear();

    navigation.navigate('Main');
  }

  function renderItem({item}) {
    return (
      <View style={styles.fileContainer}>
        <TouchableOpacity onPress={() => handleDeleteFile(item._id)}>
          <Icon name="delete" size={24} color="#f00" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => openFile(item)} style={styles.file}>
          <View style={styles.fileInfo}>
            <Icon name="insert-drive-file" size={24} color="#a5cfff" />
            <Text style={styles.fileTitle}>{item.title}</Text>
          </View>

          <Text style={styles.fileDate}>
            há{' '}
            {formatDistance(new Date(item.createdAt), new Date(), {
              locale: pt,
            })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={handleLogout}>
        <Text style={styles.boxTitle}>{box.title}</Text>
      </TouchableOpacity>

      <FlatList
        style={styles.list}
        data={box.files}
        keyExtractor={file => file._id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={renderItem}
      />

      <TouchableOpacity style={styles.fab} onPress={handleUpload}>
        <Icon name="cloud-upload" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    flex: 1,
  },

  boxTitle: {
    marginTop: 50,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },

  list: {
    marginTop: 30,
  },

  fileContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  file: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    marginLeft: 10,
  },

  separator: {
    height: 1,
    backgroundColor: '#EEE',
  },

  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  fileTitle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },

  fileDate: {
    fontSize: 14,
    color: '#666',
  },

  fab: {
    position: 'absolute',
    right: 30,
    bottom: 30,
    width: 60,
    height: 60,
    backgroundColor: '#7159c1',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
