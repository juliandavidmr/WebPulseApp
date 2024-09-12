import {useCallback, useEffect, useState} from "react";

import { StyleSheet, FlatList, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Input, InputField } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import colors from "tailwindcss/colors";

type TUrl = {
  id: string;
  url: string;
  status: string;
};

const generateRandomId = () => Math.random().toString(36).substring(7);

export default function HomeScreen() {
  const [urls, setUrls] = useState<TUrl[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [checkURLsStates, setCheckURLsStates] = useState<Record<string, boolean>>({});

  // Cargar URLs guardadas
  useEffect(() => {
    const loadUrls = async () => {
      try {
        const savedUrls = await AsyncStorage.getItem('urls');
        if (savedUrls) setUrls(JSON.parse(savedUrls));
      } catch (error) {
        console.error('Error al cargar URLs:', error);
      }
    };
    void loadUrls();
  }, []);

  // Guardar URLs
  const saveUrls = async (urls: TUrl[]) => {
    try {
      await AsyncStorage.setItem('urls', JSON.stringify(urls));
    } catch (error) {
      console.error('Error al guardar URLs:', error);
    }
  };

  // Añadir una nueva URL
  const addUrl = () => {
    if (newUrl.trim() === '') {
      Alert.alert('Error', 'La URL no puede estar vacía.');
      return;
    }
    const updatedUrls = [...urls, {
      id: generateRandomId(),
      url: newUrl,
      status: 'unknown',
    } satisfies TUrl];
    setUrls(updatedUrls);
    void saveUrls(updatedUrls);
    setNewUrl('');
  };

  // Verificar el estado de una URL usando fetch
  const checkUrlStatus = useCallback(async (index: number) => {
    const updatedUrls = [...urls];

    try {
      setCheckURLsStates((prev) => ({
        ...prev,
        [updatedUrls[index].id]: true,
      }));
      setUrls(updatedUrls);

      const response = await fetch(updatedUrls[index].url);
      updatedUrls[index].status = response.ok ? 'Online' : `Error ${response.status}`;
    } catch (error) {
      updatedUrls[index].status = 'Offline';
    }

    setCheckURLsStates((prev) => ({
      ...prev,
      [updatedUrls[index].id]: false,
    }));

    setUrls(updatedUrls);
    void saveUrls(updatedUrls);
  }, [urls]);

  // Renderizar cada URL
  const renderUrlItem = ({ item, index }: {
    item: TUrl;
    index: number;
  }) => (
    <ThemedView style={styles.urlContainer}>
      <ThemedText>{item.url}</ThemedText>
      {checkURLsStates[item.id] ?
        <Spinner size="small" color={colors.gray[500]} style={{ marginBottom: 12 }} /> :
        <ThemedText>Status: {item.status}</ThemedText>
      }
      <Button
        title="Check"
        onPress={() => checkUrlStatus(index)}
        disabled={checkURLsStates[item.id]}
      />
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>WebPulse</ThemedText>
      <Input style={styles.input} isFocused>
        <InputField placeholder="Añadir URL" value={newUrl} onChangeText={setNewUrl} type="text" />
      </Input>
      <Button title="Agregar URL" onPress={addUrl} />
      <FlatList
        data={urls}
        renderItem={renderUrlItem}
        keyExtractor={_ => _.id}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
  },
  urlContainer: {
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginTop: 12,
  },
});
