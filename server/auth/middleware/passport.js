const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../../database/models/User');
const Student = require('../../database/models/Student');

module.exports = function (passportInstance = passport) {
  // Only configure Google OAuth if credentials are provided
  console.log('Passport config - Google OAuth:', {
    hasClientID: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  });
  
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('Configuring Google OAuth strategy...');
    passportInstance.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
          // Force account selection every time
          prompt: 'select_account',
        },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] && profile.emails[0].value;
          
          // Validate student email domain for new users
          if (!email || !email.endsWith('@student.fatima.edu.ph')) {
            return done(new Error('Only Fatima student Google accounts (@student.fatima.edu.ph) are allowed for authentication'), null);
          }
          
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            // Check if a user with same email exists
            user = await User.findOne({ email });
            if (user) {
              user.googleId = profile.id;
              await user.save();
            } else {
              // New user defaults to student role for Fatima student emails
              user = await User.create({
                email,
                role: 'student',
                googleId: profile.id,
              });
              
              // Create a basic Student profile for Google OAuth users
              await Student.create({
                user: user._id,
                studentId: `GOOGLE-${profile.id.slice(0, 10)}`, // Temporary ID
                firstName: profile.name?.givenName || 'Student',
                lastName: profile.name?.familyName || 'User',
                dateOfBirth: new Date('2000-01-01'), // Placeholder
                phone: '09000000000', // Valid 11-digit placeholder - will be updated later
                address: {
                  street: 'To be updated',
                  city: 'To be updated',
                  state: 'To be updated',
                  zipCode: '0000',
                  country: 'Philippines',
                },
                assessmentCompleted: false,
                assessmentScore: null,
                skills: [],
              });
            }
          }
          
          // Update last login timestamp
          user.lastLogin = new Date();
          await user.save();
          
          return done(null, user);
        } catch (err) {
          console.error('Google OAuth error:', err);
          return done(err, null);
        }
      }
    )
  );
  }

  // Serialize / deserialize not needed for JWT flow, but kept for completeness
  passportInstance.serializeUser((user, done) => {
    done(null, user.id);
  });

  passportInstance.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
