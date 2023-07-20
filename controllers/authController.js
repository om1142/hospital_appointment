require('dotenv').config();
const nodemailer = require('nodemailer');
const User = require('../models/user');
const Appointment = require('../models/appointment');
const Report = require('../models/report');
const validator = require('validator');





const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET;



const validatepassword = (password) => {
    let errors = [];
    if (password.length < 6 || password.length > 16) {
        errors.push('Password must be between 6 and 16 characters');
    }
    // Number check
    if (!password.match(/[0-9]+/)) {
        errors.push('Password must contain at least one number');
    }
    // Uppercase check
    if (!password.match(/[A-Z]+/)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    // Lowercase check
    if (!password.match(/[a-z]+/)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    // Special character check
    if (!password.match(/[!@#$%^&*()]+/)) {
        errors.push('Password must contain at least one special character');
    }
    return errors;
}

const maxAge = 50 * 24 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({ id }, SECRET, {
        expiresIn: maxAge
    });
}


const sendVerifyMail = async (name, email, user_id, userrole, req) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.MAIL,
                pass: process.env.PASS,
            },
        });

        let mailOptions = {
            from: process.env.MAIL,
            to: email,
            subject: '',
            html: '',
        };
        const remaining = `/verify/${user_id}`;
        const protocol = req.protocol || 'http';
        const hostname = req.headers.host || 'localhost:3000';
        const url_ = protocol + '://' + hostname + remaining;
        //if (userrole === 'customer') {
            mailOptions.subject = 'For verification mail';
            mailOptions.html = `<p>Hii '${name}', please click <a href="${url_}">here</a> to verify your mail</p>`;
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email has been sent to ${email}: ${info.messageId}`);
    } catch (error) {
        console.error(error.message);
        throw error;
    }
};


const verifyMail = async (req, res) => {
    try {
        const updateInfo = await User.updateOne({ _id: req.params.id }, { $set: { isVerified: Boolean(true) } });
        const customer = await User.findOne({ _id: req.params.id });
        console.log(customer);
        console.log(updateInfo);
        res.render('login', { err: 'Your account is verified successfully' });
    } catch (error) {
        console.log(error.message);
        res.log('Inside catch block of verifyMail.');
    }
}



const login_get = (req, res) => {
    const err = undefined;
    res.render('login', { title: 'Login', err });
}
const login_post = async (req, res) => {
    try {
        const phone = req.body.phone;
        const password = req.body.password;
        const customer = await User.findOne({phone});
        if (customer.isVerified) {
            const auth = await bcrypt.compare(password, customer.password);
            if (customer && auth) {
                if(customer.phone === "9173505413"){
                    res.cookie('jwt', '', { maxAge: 1 });
                    const token = createToken(customer._id);
                    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
                    const doctor1 = 'Dr. John Doe';
                    const doctor2 = 'Dr. Jane Smith';
                    const currentDate = new Date();
                    const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
                    const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);
                    const appointments1 = await Appointment.find({doctor:doctor1,date: {$gte: startOfDay,$lte: endOfDay}});
                    const appointments2 = await Appointment.find({doctor:doctor2,date: {$gte: startOfDay,$lte: endOfDay}});
                    res.status(201).render('manager/index', { customer,appointments1,appointments2, err: 'You have logged in successfully.' });
                }
                else{
                    res.cookie('jwt', '', { maxAge: 1 });
                    const token = createToken(customer._id);
                    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const upcomingAppointments = await Appointment.find({ phone: phone, date: { $gte: today } });
                    res.status(201).render('customer/index', { customer, upcomingAppointments, err: 'You have logged in successfully.' });
                }
            } else {
                const err = 'Invalid login details.';
                res.status(500).render('login', { err });
            }
        }
        else {
            const err = 'Invalid login details.';
            res.status(500).render('login', { err });
        }
    } catch (error) {
        const err = `User doesn't exist.`;
        res.status(404).render('404', { err });
    }
};

const signup_get = (req, res) => {
    const err = undefined;
    res.render('signup', { err });
}
const signup_post = async (req, res) => {
    const password = req.body.password;
    const cpassword = req.body.cpassword;

    //validate password
    const validpassword = validatepassword(password);
    if (!validpassword) {
        res.status(500).render('signup', { err: "Password must be between 6 to 16 characters and must contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character" });
    }

    if (password === cpassword) {
        const user = new User({
            fullname: req.body.fullname,
            email: req.body.email,
            password: req.body.password,
            phone: req.body.phone,
            gender: req.body.gender,
            date: req.body.birthdate,
        });
        const foundUser = await User.findOne({ phone: user.phone });
        if (foundUser) {
            const err = 'Phone number already exists.';
            res.status(500).render('signup', { err });
        }
        const foundEmail = await User.findOne({ email: user.email });

        if (foundEmail) {
            res.status(500).render('signup', { err: "Email already exists." });
        }
        if (validator.isEmail(`${user.email}`) === false) {
            res.status(500).render('signup', { err: "Email is not valid." });
        }
        const now = new Date();
        const age = now.getFullYear() - user.date.getFullYear();

        // Validate birthdate constraints
        if (age < 5) {
            return res.status(500).render('signup', { err: 'You must be at least 5 years old to sign up.' });
        } else if (age > 110) {
            return res.status(500).render('signup', { err: 'Invalid birth date.' });
        }
        //if not exists then save the user in the database
        user.save().then(async (result) => {
            const sendMail = await sendVerifyMail(req.body.fullname, req.body.email, result._id, req.body.role, req);
            res.status(200).render('login', { err: 'Please verify your email to log in successfully.' });
        }).catch((err) => {
            console.log(err);
        }
        );
    } else {
        res.status(500).render('signup', { err: "Password are not matching." });
    }

}

const sendForgotPasswordMail = async (name, email, user_id, req) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.MAIL,
                pass: process.env.PASS,
            },
        });

        const remaining = `/resetpassword/${user_id}`;
        const protocol = req.protocol || 'http';
        const hostname = req.headers.host || 'localhost:3000';
        const url_ = protocol + '://' + hostname + remaining;

        let mailOptions = {
            from: process.env.MAIL,
            to: email,
            subject: 'Password reset for central mess portal',
            html: `<p>Hii '${name}', please click <a href="${url_}">here</a> to reset your password.</p>`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email has been sent to ${email}: ${info.messageId}`);
    } catch (error) {
        res.status(404).render('404', { err: 'sendForgotPasswordMail error' });
    }
};

const forgotpassword_get = async (req, res) => {
    try {
        res.render('forgotpassword', { err: undefined });
    }
    catch (error) {
        res.status(404).render('404', { err: 'forgotpassword_get error' });
    }
}

const forgotpassword_post = async (req, res) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({ email: email });
        if (user) {
            const mailSend = await sendForgotPasswordMail(user.fullname, email, user._id, req);
            res.render('login', { err: 'Please check your mail to successfully reset password.' });
        }
        else {
            res.status(500).render('forgotpassword', { err: 'User not found.' });
        }
    } catch (error) {
        res.status(400).render('404', { err: 'forgotpassword_post error' });
    }
}

const resetpassword_get = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findOne({ _id: id });
        if (user) {
            res.render('resetpassword', { user: user, err: undefined });
        }
        else {
            res.status(404).render('404', { err: 'User not found.' });
        }
    } catch (error) {
        res.status(404).render('404', { err: 'resetpassword_get error' });
    }
}

const resetpassword_patch = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findOne({ _id: id });
        if (user) {
            const password = req.body.password;
            const cpassword = req.body.cpassword;
            if (password === cpassword) {
                const hashedPassword = await bcrypt.hash(password, 12);
                User.updateOne({ _id: id }, { $set: { password: hashedPassword }, validate: true })
                    .then((result) => {
                        console.log(result);
                        res.render('login', { err: 'Password updated successfully.' });
                    })
                    .catch((err) => {
                        res.status(404).render('404', { err: 'cannot perform updation error' });
                    });
            }
            else {
                res.status(500).render('resetpassword', { user: user, err: 'Password are not matching.' });
            }
        }
        else {
            res.status(500).render('login', { err: 'User not found.' });
        }
    } catch (error) {
        res.status(404).render('404', { err: 'resetpassword_patch error' });
    }
}

const customer_get = async (req, res) => {
    try {
        const phone = req.params.phone; // use req.params.username to get the username
        const customer = await User.findOne({ phone: phone });
        if(phone === "9173505413"){
            const doctor1 = 'Dr. John Doe';
            const doctor2 = 'Dr. Jane Smith';
            const currentDate = new Date();
            const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
            const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);
            const appointments1 = await Appointment.find({doctor:doctor1,date: {$gte: startOfDay,$lte: endOfDay}});
            const appointments2 = await Appointment.find({doctor:doctor2,date: {$gte: startOfDay,$lte: endOfDay}});
            const reportPromises1 = appointments1.map(appointment => Report.findOne({ phone: appointment.phone, date:appointment.date, timeSlot:appointment.timeSlot }));
            const reports = await Promise.all(reportPromises1);
            const appointmentsWithReports1 = appointments1.map((appointment, index) => {
                const report = reports[index];
                return {
                  ...appointment.toObject(),
                  reportVisited: report ? report.visited : false
                };
              });

              const reportPromises2 = appointments2.map(appointment => Report.findOne({ phone: appointment.phone }));
              const reports2 = await Promise.all(reportPromises2);
              const appointmentsWithReports2 = appointments2.map((appointment, index) => {
                  const report = reports2[index];
                  return {
                    ...appointment.toObject(),
                    reportVisited: report ? report.visited : false
                  };
                });
            res.render('manager/index', { customer: customer,appointments1:appointmentsWithReports1,appointments2:appointmentsWithReports2, err: undefined });
        }
        else{
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const upcomingAppointments = await Appointment.find({ phone: phone, date: { $gte: today } });
            res.render('customer/index', { customer: customer, upcomingAppointments, err: undefined });
        }
    } catch (error) {
        res.status(404).render('404', { err: 'Customer_get error' });
    }
}


const customer_view_get = async (req, res) => {
    try {
        const phone = req.params.phone;
        const customer = await User.findOne({ phone:phone });
        if (customer) {
            res.render('customer/view', { customer: customer, err: undefined });
        } else {
            res.status(500).render('signup', { err: `Customer doesn't exist.` });
        }


    } catch (error) {
        res.status(404).render('404', { err: `customer_view get error` });
    }
}

const customer_edit_get = async (req, res) => {
    try {
        const phone = req.params.phone;
        const customer = await User.findOne({ phone:phone });
        if (customer) {

            res.render('customer/edit', { customer: customer, err: undefined });
            // res.send(customer);
        } else {
            res.status(500).render('signup', { err: `Customer doesn't exist.` });
        }

    } catch (error) {
        res.status(404).render('signup', { err: `Customer doesn't exist.` });
    }
}
const customer_edit_patch = async (req, res) => {
    try {
        const { phone } = req.params; // use req.params.username to get the username
        const customer = await User.findOne({ phone:phone });
        customer.fullname = req.body.fullname;
        customer.date = req.body.date;
        customer.gender = req.body.gender;
        const now = new Date();
        const age = now.getFullYear() - customer.date.getFullYear();

        // Validate birthdate constraints
        if (age < 5) {
            return res.status(500).render('customer/edit', { customer, err: 'You must be at least 5 years old to sign up.' });
        } else if (age > 110) {
            return res.status(500).render('customer/edit', { customer, err: 'Invalid birth date.' });
        }

        User.updateOne({ phone:phone },
            { $set: { fullname: req.body.fullname, date: req.body.date, gender: req.body.gender }, validate: true }).then((result) => {
                console.log(result);
                res.render('customer/view', { customer: customer, err: 'Profile has been updated successfully.' });
            }).catch((err) => {
                res.status(404).render('404', { err: "customer update error" });
            }
            );



    } catch (error) {
        res.status(404).render('404', { err: `customer_edit_patch error` });
    }
};

const manager_get = async (req, res) => {
    try {
        const phone = req.params.phone; // use req.params.username to get the username
        const manager = await User.findOne({ phone: phone });
        // console.log(manager);
        res.render('manager/index', { customer: manager, err: undefined });
    } catch (error) {
        res.status(404).render('404', { err: `manager_get error` });
        // console.log(error);
        // res.send('An error occurred while finding the manager.');
    }
}

const appointmentWithoutLogin_get = (req, res) => {
    try {
        res.render('appointmentWithoutLogin');
    }
    catch (error) {
        res.status(404).render('404', { err: "about not found" });
    }
}



const customer_about_get = async (req, res) => {
    try {
        const phone = req.params.phone;
        const customer = await User.findOne( {phone: phone});
        if (customer) {
            res.render('customer/about', { customer: customer });
        }
        else {
            // res.send('An error occurred while finding the customer.');
            res.status(404).render('404', { err: 'customer_about_get error' });
        }
    } catch (error) {
        // console.log(error);
        // res.send('An error occurred while finding the customer.');
        res.status(404).render('404', { err: 'An error occurred while finding the customer.' });
    }
}

const customer_appointment_get = async (req, res) => {
    try {
        const phone = req.params.phone;
        const customer = await User.findOne( {phone: phone});
        if(phone==="9173505413" && customer){
            res.render('manager/appointment', { customer: customer , err: undefined });
        }
        else if (customer) {
            res.render('customer/appointment', { customer: customer , err: undefined });
        }
        else {
            // res.send('An error occurred while finding the customer.');
            res.status(404).render('404', { err: 'customer_about_get error' });
        }
    } catch (error) {
        // console.log(error);
        // res.send('An error occurred while finding the customer.');
        res.status(404).render('404', { err: 'An error occurred while finding the customer.' });
    }
}

const manager_appointment_get = async (req, res) => {
    try {
        const phone = req.params.phone;
        const customer = await User.findOne( {phone: phone});
        if (customer) {
            res.render('manager/appointment', { customer: customer , err: undefined });
        }
        else {
            // res.send('An error occurred while finding the customer.');
            res.status(404).render('404', { err: 'customer_about_get error' });
        }
    } catch (error) {
        // console.log(error);
        // res.send('An error occurred while finding the customer.');
        res.status(404).render('404', { err: 'An error occurred while finding the customer.' });
    }
}

const getAvailableTimeSlots = (req, res) => {
    const { date, doctor } = req.query;
    console.log("in getavailabletimeslots");
    console.log(req.params);
    console.log(req.query);
    console.log(date);
    console.log(doctor);
  
    // Fetch the booked appointments from the database
    Appointment.find({ date: date, doctor: doctor })
      .then(bookedAppointments => {
        // Extract the booked time slots
        const bookedTimeSlots = bookedAppointments.map(appointment => appointment.timeSlot);
  
        // Define all available time slots
        const allTimeSlots = [
          '9:00 AM', '9:20 AM', '9:40 AM', '10:00 AM', '10:20 AM', '10:40 AM', '11:00 AM', '11:20 AM',
          '11:40 AM', '12:00 PM', '12:20 PM', '12:40 PM', '1:00 PM', '1:20 PM', '1:40 PM', '2:00 PM',
          '2:20 PM', '2:40 PM', '3:00 PM', '3:20 PM', '3:40 PM', '4:00 PM', '4:20 PM', '4:40 PM'
        ];
  
        // Filter the available time slots based on the booked appointments
        const availableTimeSlots = allTimeSlots.filter(slot => !bookedTimeSlots.includes(slot));
  
        res.json({ availableTimeSlots, bookedTimeSlots });
      })
      .catch(error => {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch available time slots' });
      });
};
  
// Controller method to create a new appointment
const createAppointment = async(req, res) => {
    const { date, doctor, timeSlot } = req.body;
    const phone = req.params.phone;
    const customer = await User.findOne({phone});
    const fullname = customer.fullname;
    console.log("in createappointment");
    console.log(req.body);
  
    // Create a new Appointment record
    const appointment = new Appointment({
      phone,
      fullname,
      date,
      doctor,
      timeSlot
    });
  
    // Save the appointment to the database
    appointment.save()
      .then(() => {
        res.json({ message: 'Appointment created successfully' });
      })
      .catch((error) => {
        res.status(500).json({ error: 'Failed to create appointment' });
      });
};

// Controller method to create a new appointment
const createAppointment_manager = async(req, res) => {
    const { date, doctor, timeSlot,fullname,phone } = req.body;
    const phone1 = req.params.phone;
    console.log("in createappointment_manager");
    console.log(req.body);
    const manager = await User.findOne({ phone:phone1 });
    console.log(phone1);
  
    // Create a new Appointment record
    const appointment = new Appointment({
      phone,
      fullname,
      date,
      doctor,
      timeSlot
    });
  
    // Save the appointment to the database
        console.log("me aa gya");
        appointment.save()
        .then(() => {
            res.json({ message: 'Appointment created successfully' });

        })
        .catch((error) => {
            console.log("kahi error to nahi");
            res.status(500).json({ error: 'Failed to create appointment' });
        });

};


const manager_report_get = async (req, res) => {
    try {
        const phone = req.params.phone;
        const phone1 = req.params.phone1;
        const date = req.params.date;
        const time = req.params.time;
        const manager = await User.findOne({ phone:phone });
        const patient1 = await Appointment.findOne({ phone: phone1 ,date:date,timeSlot:time});
        if (manager) {
            res.render('manager/report', { customer: manager ,patient: patient1 });
        }
        else {
            // res.send("Customer not found");
            res.status(404).render('404', { err: 'Customer not found' });
        }
    } catch (error) {
        console.log(error);
    }
}

const manager_report_post = async (req, res) => {

    const phone = req.params.phone;
    const phone1 = req.params.phone1;
    const date = req.params.date;
    const time = req.params.time;
    const manager = await User.findOne({ phone:phone });
    const patient1 = await Appointment.findOne({ phone: phone1 ,date:date,timeSlot:time});
        const report = new Report({
            fullname: patient1.fullname,
            //username: req.body.username,
            //email: req.body.email,
            //password: req.body.password,
            phone: patient1.phone,
           // role: req.body.role,
            gender: req.body.gender,
            date: patient1.date,
            doctor: patient1.doctor,
            medicine: req.body.medicine,
            disease: req.body.disease,
            timeSlot: patient1.timeSlot,
            visited: true
        });

        if (manager ) {
            console.log("andar to jay 6e");
            //report.visited=true;
            report.save().then(async() => {
                const doctor1 = 'Dr. John Doe';
                const doctor2 = 'Dr. Jane Smith';
                const currentDate = new Date();
                const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);
                const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);
                const appointments1 = await Appointment.find({doctor:doctor1,date: {$gte: startOfDay,$lte: endOfDay}});
                const appointments2 = await Appointment.find({doctor:doctor2,date: {$gte: startOfDay,$lte: endOfDay}});

                const reportPromises1 = appointments1.map(appointment => Report.findOne({ phone: appointment.phone }));
                const reports = await Promise.all(reportPromises1);
                const appointmentsWithReports1 = appointments1.map((appointment, index) => {
                    const report = reports[index];
                    return {
                      ...appointment.toObject(),
                      reportVisited: report ? report.visited : false
                    };
                  });
    
                  const reportPromises2 = appointments2.map(appointment => Report.findOne({ phone: appointment.phone }));
                  const reports2 = await Promise.all(reportPromises2);
                  const appointmentsWithReports2 = appointments2.map((appointment, index) => {
                      const report = reports2[index];
                      return {
                        ...appointment.toObject(),
                        reportVisited: report ? report.visited : false
                      };
                    });

                res.status(200).render('manager/index', { customer: manager,appointments1:appointmentsWithReports1,appointments2:appointmentsWithReports2, err: `Report saved`  });
            }).catch((err) => {
                console.log(err);
            }
            );
        }
        else{
            console.log("nai thayu");
            const err = 'Appointment is not booked yet.';
            res.status(500).render('manager/report', {customer: manager, err });
        }
}
  
const viewreport_get = async (req, res) => {
    try {
        //const { managerMobileNumber, userMobileNumber } = req.params;
        const phone = req.params.phone;
        const phone1 = req.params.phone1;
        const date = req.params.date;
        const time = req.params.time;
        const manager = await User.findOne({ phone:phone });
        const patient = await Report.findOne({ phone: phone1 , date:date,timeSlot:time });
        const patient1 = await Appointment.findOne({ phone: phone1, date:date,timeSlot:time });
        if (manager && patient && patient.visited) {
            res.render('manager/viewreport', { customer: manager , patient: patient });
        }
        else if(manager && patient1){
            res.render('manager/report', { customer: manager , patient: patient1 });
        }
        else {
            // res.send("Customer not found");
            res.status(404).render('404', { err: 'Customer not found' });
        }
    } catch (error) {
        // console.log(error);
        // res.send("Customer not found");
        res.status(404).render('404', { err: 'customer_faq_get error' });
    }
}



const manager_history_get = async (req, res) => {
    try {
        const phone = req.params.phone;
        const searchPhone = req.query.phone;
        const manager = await User.findOne({ phone:phone });
        if(phone==="9173505413" && manager){
            let appointments1;
      
            if (searchPhone) {
                appointments1 = await Appointment.find({ phone: searchPhone });
            } else {
                appointments1 = await Appointment.find({ });
            }
            const reportPromises = appointments1.map(appointment => Report.findOne({ phone: appointment.phone , date:appointment.date, timeSlot:appointment.timeSlot}));
            const reports = await Promise.all(reportPromises);
            const appointmentsWithReports = appointments1.map((appointment, index) => {
                const report = reports[index];
                return {
                  ...appointment.toObject(),
                  reportVisited: report ? report.visited : false
                };
              });
            //console.log(reports.phone);
            res.render('manager/history', { customer: manager , appointments1:appointmentsWithReports , err: undefined });
        }
        else {
            // res.send("Customer not found");
            res.status(404).render('404', { err: 'Customer not found' });
        }
    } catch (error) {
        // console.log(error);
        // res.send("Customer not found");
        res.status(404).render('404', { err: 'customer_faq_get error' });
    }
}

const customer_history_get = async (req, res) => {
    try {
        const phone = req.params.phone;
        const customer = await User.findOne({ phone:phone });
        if( customer ){
            const today = new Date();
            let appointments1;
            appointments1 = await Appointment.find({ phone: phone,  date: { $lt: today } });
            const reportPromises = appointments1.map(appointment => Report.findOne({ phone: appointment.phone , date:appointment.date, timeSlot:appointment.timeSlot}));
            const reports = await Promise.all(reportPromises);
            const appointmentsWithReports = appointments1.map((appointment, index) => {
                const report = reports[index];
                return {
                  ...appointment.toObject(),
                  reportVisited: report ? report.visited : false
                };
              });
            res.render('customer/history', { customer: customer , appointments1:appointmentsWithReports, err: undefined });
        }
        else {
            // res.send("Customer not found");
            res.status(404).render('404', { err: 'Customer not found' });
        }
    } catch (error) {
        // console.log(error);
        // res.send("Customer not found");
        res.status(404).render('404', { err: 'customer_faq_get error' });
    }
}

const customer_viewreport_get = async (req, res) => {
    try {
        //const { managerMobileNumber, userMobileNumber } = req.params;
        const phone = req.params.phone;
        const date = req.params.date;
        const time = req.params.time;
        //const phone1 = req.params.phone1;
        const patient = await User.findOne({ phone:phone });
        //const patient = await Report.findOne({ phone: phone1 });

        const patient1 = await Report.findOne({ phone: phone, date:date , timeSlot:time });

        //console.log(patient1);
        if ( patient && patient1.visited) {
            res.render('customer/viewreport', { customer: patient , patient: patient1 });
        }
        else if(patient){
            const today = new Date();
            let appointments1;
            appointments1 = await Appointment.find({ phone: phone,  date: { $lt: today } });
            const reportPromises = appointments1.map(appointment => Report.findOne({ phone: appointment.phone , date:appointment.date, timeSlot:appointment.timeSlot}));
            const reports = await Promise.all(reportPromises);
            const appointmentsWithReports = appointments1.map((appointment, index) => {
                const report = reports[index];
                return {
                  ...appointment.toObject(),
                  reportVisited: report ? report.visited : false
                };
              });
            res.render('customer/history', { customer: patient,appointments1:appointmentsWithReports ,err: `Report not made yet` });
        }
        else {
            // res.send("Customer not found");
            res.status(404).render('404', { err: 'Customer not found' });
        }
    } catch (error) {
        // console.log(error);
        // res.send("Customer not found");
        res.status(404).render('404', { err: 'customer_faq_get error' });
    }
}

const manager_delete_appointment = async (req, res) => {
    try {
        const phone = req.params.phone;
      const phone1 = req.params.phone1;
      const appointmentDate = req.params.date;
      const appointmentTimeSlot = req.params.timeSlot;

      const deletedAppointment = await Appointment.findOneAndDelete({
        phone: phone1,
        date: appointmentDate,
        timeSlot: appointmentTimeSlot
      });

      

      console.log(phone)
      
      if (deletedAppointment) {
        res.redirect(`/manager/${phone}/history`);
      } else {
        res.status(404).render('404', { err: 'Appointment not found' });
      }
    } catch (error) {
      res.status(404).render('404', { err: 'delete_appointment error' });
    }
}

const customer_delete_appointment = async (req, res) => {
    try {
        const phone = req.params.phone;
      const phone1 = req.params.phone1;
      const appointmentDate = req.params.date;
      const appointmentTimeSlot = req.params.timeSlot;
      const deletedAppointment = await Appointment.findOneAndDelete({
        phone: phone1,
        date: appointmentDate,
        timeSlot: appointmentTimeSlot
      });

      console.log(phone)
      
      if (deletedAppointment) {
        res.redirect(`/customer/${phone}`);
      } else {
        res.status(404).render('404', { err: 'Appointment not found' });
      }
    } catch (error) {
      res.status(404).render('404', { err: 'delete_appointment error' });
    }    
}

const about_get = (req, res) => {
    try {
        res.render('about');
    }
    catch (error) {
        res.status(404).render('404', { err: "about not found" });
    }
}

const logout_get = (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.render('home');
}
module.exports = {
    login_get,
    login_post,

    resetpassword_get,
    resetpassword_patch,

    forgotpassword_get,
    forgotpassword_post,

    signup_get,
    signup_post,
    customer_get,
 
    customer_view_get,

    customer_edit_get,

    customer_edit_patch,
    customer_about_get,


    customer_appointment_get,
    manager_appointment_get,

    manager_get,

    

   
    appointmentWithoutLogin_get,


    getAvailableTimeSlots,
    createAppointment,
    createAppointment_manager,

    verifyMail,
    sendVerifyMail,
    logout_get,

    manager_report_get,
    manager_report_post,
    viewreport_get,

    manager_history_get,
    customer_history_get,
    customer_viewreport_get,

    manager_delete_appointment,
    customer_delete_appointment,
    about_get,


};