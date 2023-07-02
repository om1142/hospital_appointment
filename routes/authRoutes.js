const { Router } = require('express');
const router = Router();
const authController = require('../controllers/authController');
const methodoverride = require('method-override');
const { requireAuth, checkUser } = require('../middleware/authMiddleware');
router.use(methodoverride('_method'));

router.get('*', checkUser);
router.patch('*', checkUser);
router.post('*', checkUser);
router.delete('*', checkUser);


router.get('/login', authController.login_get);
router.post('/login', authController.login_post);

router.get('/forgotpassword', authController.forgotpassword_get);
router.post('/forgotpassword', authController.forgotpassword_post);

router.get('/resetpassword/:id', authController.resetpassword_get);
router.patch('/resetpassword/:id', authController.resetpassword_patch);

router.get('/signup', authController.signup_get);
router.get('/appointmentWithoutLogin', authController.appointmentWithoutLogin_get);



router.get('/customer/:phone/time-slots', authController.getAvailableTimeSlots);
router.post('/customer/:phone/appointments', authController.createAppointment);
router.post('/manager/:phone/appointments', authController.createAppointment_manager);



router.post('/signup', authController.signup_post);

router.get('/customer/:phone', requireAuth, authController.customer_get);

router.get('/customer/:phone/edit', requireAuth, authController.customer_edit_get);
router.patch('/customer/:phone/edit', requireAuth, authController.customer_edit_patch);

router.get('/customer/:phone/view', requireAuth, authController.customer_view_get);


router.get('/manager/:phone', requireAuth, authController.customer_get);

router.get('/customer/:phone/about', requireAuth, authController.customer_about_get);

router.get('/customer/:phone/appointment', requireAuth, authController.customer_appointment_get);
router.get('/manager/:phone/appointment', requireAuth, authController.manager_appointment_get);



router.get('/verify/:id', authController.verifyMail);
router.get('/about',authController.about_get);

router.post('/home', authController.logout_get);
router.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
}
);

router.get('/home', (req, res) => {
    res.render('home', { title: 'Home' });
}
);

router.get('/manager/:phone/report/:phone1/:date/:time', requireAuth, authController.manager_report_get);
router.post('/manager/:phone/report/:phone1/:date/:time', requireAuth, authController.manager_report_post);

router.get('/manager/:phone/viewreport/:phone1/:date/:time', requireAuth, authController.viewreport_get);

router.get('/manager/:phone/history', requireAuth, authController.manager_history_get);
router.get('/customer/:phone/history', requireAuth, authController.customer_history_get);

router.get('/customer/:phone/viewreport/:date/:time', requireAuth, authController.customer_viewreport_get);

router.delete('/manager/:phone/history/:phone1/:date/:timeSlot', requireAuth, authController.manager_delete_appointment);

router.delete('/customer/:phone/index/:phone1/:date/:timeSlot', requireAuth, authController.customer_delete_appointment);

router.use((req, res) => {
    res.status(404).render('404', { err: '404 page not found' });
}
);

module.exports = router;