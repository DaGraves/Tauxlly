import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, SafeAreaView, StyleSheet, View} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import Profile from '../components/Profile';
import {colors} from '../styles/common';

const BATCH_SIZE = 10;

const OtherProfileScreen = props => {
  const navigation = useNavigation();
  const userId = props.route.params.userId;
  const [posts, setPosts] = useState({});
  const [extraPosts, setExtraPosts] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const lastDocRef = useRef(null);

  const handleLogOut = useCallback(async () => {
    await auth().signOut();
  }, []);

  const handleEditProfile = useCallback(() => {
    navigation.navigate('EditProfile');
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      if (lastDocRef.current) {
        // Subsequent, paginated fetches
        const dbData = await firestore()
          .collection('posts')
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .startAfter(lastDocRef.current)
          .limit(BATCH_SIZE)
          .get();

        if (!dbData.empty) {
          let data = {};
          dbData.docs.forEach((item, idx) => {
            data = {...data, [item.id]: {id: item.id, ...item.data()}};
            if (idx === dbData.docs.length - 1) {
              lastDocRef.current = item;
            }
          });
          setPosts({...posts, ...data});
          setExtraPosts(data);
        }
      } else {
        // Initial fetch
        const dbData = await firestore()
          .collection('posts')
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(BATCH_SIZE)
          .get();
        let data = {};
        dbData.docs.forEach((item, idx) => {
          data = {...data, [item.id]: {id: item.id, ...item.data()}};
          if (idx === dbData.docs.length - 1) {
            lastDocRef.current = item;
          }
        });
        setPosts(data);
        setLoading(false);
      }
    } catch (e) {
      Alert.alert(
        'Something went wrong',
        'We had issues fetching these posts... Please try again later!',
        [
          {
            text: 'Ok',
            style: 'cancel',
          },
        ],
        {cancelable: false},
      );
    }
  }, [posts, userId]);

  const fetchUser = async () => {
    const dataRef = await firestore()
      .collection('users')
      .doc(userId)
      .get();
    setUser({id: userId, ...dataRef.data()});
  };

  useEffect(() => {
    setLoading(true);
    fetchUser();
    fetchPosts();
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <Profile
          handleLogOut={handleLogOut}
          handleEditProfile={handleEditProfile}
          posts={posts}
          extraPosts={extraPosts}
          setPosts={setPosts}
          fetchPosts={fetchPosts}
          batchSize={BATCH_SIZE}
          otherUser={user}
          isLoading={loading}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
});

export default OtherProfileScreen;
