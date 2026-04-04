import * as ImagePicker from 'expo-image-picker';

export type AvatarFlowState =
  | {
      kind: 'success';
      uri: string;
      title: string;
      message: string;
    }
  | {
      kind: 'cancelled';
    }
  | {
      kind: 'permission_denied';
      title: string;
      message: string;
    }
  | {
      kind: 'invalid';
      title: string;
      message: string;
    }
  | {
      kind: 'error';
      title: string;
      message: string;
    };

export class AvatarService {
  static async pickAvatarFromLibrary(): Promise<AvatarFlowState> {
    try {
      const existingPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      const permission = existingPermission.granted
        ? existingPermission
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        return {
          kind: 'permission_denied',
          title: 'Zdjęcia pozostają prywatne',
          message: permission.canAskAgain
            ? 'Aby dodać portret do swojego sanktuarium, pozwól Aetherze otworzyć bibliotekę zdjęć.'
            : 'Dostęp do zdjęć jest wyłączony. Możesz go włączyć w ustawieniach urządzenia, gdy zechcesz dodać osobisty portret.',
        };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.82,
        selectionLimit: 1,
      });

      if (result.canceled) {
        return { kind: 'cancelled' };
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        return {
          kind: 'invalid',
          title: 'Nie udało się odczytać portretu',
          message: 'Spróbuj wybrać inne zdjęcie. Najlepiej działa spokojny, pojedynczy kadr z galerii.',
        };
      }

      return {
        kind: 'success',
        uri: asset.uri,
        title: 'Portret został zapisany',
        message: 'Twoje sanktuarium ma teraz bardziej osobisty punkt wejścia.',
      };
    } catch {
      return {
        kind: 'error',
        title: 'Portret potrzebuje chwili',
        message: 'Biblioteka zdjęć nie odpowiedziała tak, jak powinna. Spróbuj ponownie za moment.',
      };
    }
  }
}
