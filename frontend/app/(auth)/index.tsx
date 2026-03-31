import { StyleSheet, TouchableOpacity, View, Text} from 'react-native';
import { router } from 'expo-router';


export default function HomeScreen(){
  return (
    
    <View style={styles.container}>          
      <Text style={styles.title}>JoinMe</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/signup')}>
          <Text style={styles.btnText}>Sign Up</Text>
        </TouchableOpacity>
     
      <TouchableOpacity
        style={styles.loginBtn}
        onPress={() => router.push('/login')}>
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>
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
    fontSize: 62,
    color: "#fff",
    fontWeight: "500",
    marginBottom: 50,
  
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 15,
  },
  registerBtn: {
    borderWidth: 1,
    borderColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
  },
  loginBtn: {
    backgroundColor: "#ff4d3a",
    paddingVertical: 12,
    paddingHorizontal: 38,
    borderRadius: 25,

  }
});