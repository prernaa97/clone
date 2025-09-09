import  "./auth.css"
import { useEffect , useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import axios from "axios";
import Swal from 'sweetalert2';
import Cookies from "js-cookie";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default ()=>{
  const [name, setName] =  useState("");
  const [email,setEmail] = useState("");
    const [password , setPassword]  = useState("");
    const [contact_no , setContact]  = useState("");
  const [mode, setMode] = useState("signin"); // signin | signup

  useEffect(() => {
    const container = document.getElementById("container");
    if (!container) return;

    if (mode === "signup") {
      container.classList.add("right-panel-active");
    } else {
      container.classList.remove("right-panel-active");
    }
  }, [mode]);

    const validate = () => {
      const nameRegex = /^[a-zA-Z]+ [a-zA-Z]+$/;
      // const nameRegex = /^[a-zA-Z]+ [a-zA-Z]+[a-zA-Z]$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; // Minimum 8 characters, at least one letter and one number
      if(!nameRegex.test(name)){
        toast.error("Please enter both Name and Surname");
        return false;
      } 
      if(!emailRegex.test(email)){
        toast.error("Invalid Email format");
        return false;
      }
      if(!passwordRegex.test(password)){
           toast.error("Password must be at least 8 characters long and include at least one letter and one number.");
          return false;
          }
          return true;
    }
    const SignUp = (e)=>{
      e.preventDefault(); // to print response from server in form tag
      if (validate()) {
        axios.post("http://localhost:5000/users/signUp", {name,email,password,contact_no})
        .then(response => {
          if (response.status === 201) {
              console.log("sign up success..",response.data.user)
                Swal.fire({
                  title: 'Success!',
                  text: 'You have successfully signed up.',
                  icon: 'success',
                  confirmButtonText: 'OK'
                });
                
                
            }
        }).catch(err => {
            console.log(err);
            toast.error("Internal Server problem");
        }) 
      }
  }

      const SignIn = (e)=>{
      e.preventDefault(); // to print response from server in form tag
    //   if (validate()) {
        axios.post("http://localhost:5000/users/signIn", {name,email,password,contact_no})
        .then(response => {
          if (response.status === 200) {
            console.log("Response.user: ",response.data.user);
            console.log("Response.user: ",response.data.token);
            Cookies.set("token", response.data.token);
              Swal.fire({
                text: 'You have successfully signed In.',
                icon: 'success',
                confirmButtonText: 'OK'
              }).then(() => {
                window.location.href = "/";
              });
            }
        }).catch(err => {
            console.log(err);
            toast.error("Internal Server problem");
        }) 
    //   }
  }

  return<>
 <ToastContainer/>
<div className="container" id="container">
  <div className="form-container sign-up-container">
    <form onSubmit={SignUp}>
      <h1>Create Account</h1>
      <div className="social-container">
        <a href="#" className="social"><i className="fab fa-facebook-f" /></a>
        <a href="#" className="social"><i className="fab fa-google-plus-g"/></a>
        <a href="#" className="social"><i className="fab fa-linkedin-in" /></a>
      </div>
      <span>or use your email for registration</span>
      <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)}/>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}/>
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}/>
      <input type="tel" placeholder="Contact number" value={contact_no} onChange={(e) => setContact(e.target.value)}/>
        <button type="submit">Sign Up</button>
    </form>
  </div>
    

  <div className="form-container sign-in-container">
    <form onSubmit={SignIn}>
      <h1>Sign in</h1>
      <div className="social-container">
        <a href="#" className="social"><i className="fab fa-facebook-f"/></a>
        <a href="#" className="social"><i className="fab fa-google-plus-g"/></a>
        <a href="#" className="social"><i className="fab fa-linkedin-in"/></a>
      </div>
      <span>or use your account</span>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}/>
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}/>
      <a href="#">Forgot your password?</a>
      <button type="submit">Sign In</button>
    </form>
  </div>
    
  <div className="overlay-container">
    <div className="overlay">
      <div className="overlay-panel overlay-left">
        <h1>Welcome Back!</h1>
        <p>To keep connected with us please login with your personal info</p>
        <button className="ghost" id="signIn" onClick={() => setMode("signin")}>Sign In</button>
      </div>
      <div className="overlay-panel overlay-right">
        <h1>Hello, Explorer!</h1>
        <p>Enter your personal details and start journey with us</p>
        <button className="ghost" id="signUp" onClick={() => setMode("signup")}>Sign Up</button>
      </div>
    </div>
  </div>
</div>

</>
}