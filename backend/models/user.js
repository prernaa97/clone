import mongoose, { Schema } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

function validateDob(dob){
    //regex format dd/mm/yyyy
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

//^(0[1-9]|[12][0-9]|3[01] ensure day b/w 1 to31
//\/(0[1-9]|1[0-2]) ensures month b/w 1 to 12
//\/\d{4}$ ensures the year has four digits.

if(!regex.test(dob)){ //match with dob
    return false // incorrect format
}

// Split the date into day, month, and year
const [day,month,year] = dob.split('/');


//create a js date obj from string 
const date = new Date(`${year}-${month}-${day}`);

// Check if the date is in the past
return date <new Date();
}

const userSchema = new Schema({

    name:{
        type:String,
         required:true,
        minlength:[3,"Name must be at least 3 character Long"],
        maxlength:[50,"Name must be at most 50 character long"],
        match: [/^[a-zA-Z]+ [a-zA-Z]+$/, "Please enter both Name and Surname"],
    },
    email:{
        type:String,
         required:true,
        trim:true,
        lowercase:true,
        unique:true,
        validate:{
            validator:validator.isEmail,
            message:"Please provide valid email"
     }
    },
        password:{
        type:String,
        required : true,
         validate: {
      validator: function (value) {
        // Strong password regex
        const strongPasswordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return strongPasswordRegex.test(value);
      },
      message:
        "Password must be at least 8 characters long, include 1 uppercase, 1 lowercase, 1 number, and 1 special character like Test@123",
    },
        // set(value) { // value = password
        //    let saltkey = bcrypt.genSaltSync(10);
        //    let encryptedPassword = bcrypt.hashSync(value,saltkey);
        //    console.log("encryptedPassword: ",encryptedPassword); // $2a$10$V4QaMkWrQJcKcqhc42T.deZakna/GLXDyY7KBVMHkyMphRpHdCoVy
        //    return encryptedPassword;
        // }
    },

    contact_no:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        maxlength:[10,"contact no must be 10 digit"],
        minlength:[10,"contact number must be 10 digit"],
        validate:{
            validator:function(v){
                return /^[0-9]{10}$/.test(v); // contact
            },
            message:"contact number must be 10 digit"
        }
    },
    
    dateOfBirth:{
            type:String,
              required: true,
            trim: true,
            validate:{
                validator:validateDob,
                message:"Date of Birth must be in the format dd/mm/yyyy and in the past"
            }
        },   
},
{timestamps:true})

//  Password checking helper
userSchema.methods.checkPassword = function (plainPassword) {
  return bcrypt.compareSync(plainPassword, this.password);
};

userSchema.pre("save", async function(next){
  if(!this.isModified("password")) return next(); // only hash if modified
  let salt = await bcrypt.genSaltSync(10);
  this.password = await bcrypt.hashSync(this.password, salt);
  next();
});

const User = mongoose.model("User",userSchema);
export default User;