import { StyleSheet, TouchableOpacity, View, Text} from 'react-native';
import { router } from 'expo-router';


export default function HomeScreen(){
  return (
    
    <View style={styles.container}>          
      <Text style={styles.title}>JoinMe</Text>
      <View style={styles.buttonContainer}>
         <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/signup')}>
          <Text style={styles.btnText}>Sign Up</Text>
        </TouchableOpacity>
        </View>
      <View style={styles.buttonWrapper}>
      <TouchableOpacity
        style={styles.loginBtn}
        onPress={() => router.push('/login')}>
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>
      </View>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 70,
    color: "#fff",
    fontWeight: "500",
    marginBottom: 20,
  
  },
  buttonWrapper: {
  flex: 1,
  marginHorizontal: 5,
},
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginHorizontal: 20,

  },
  registerBtn: {
    borderWidth: 1,
    borderColor: "#fff",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
  },
  loginBtn: {
    flex: 1,
    backgroundColor: "#ff4d3a",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  }
});