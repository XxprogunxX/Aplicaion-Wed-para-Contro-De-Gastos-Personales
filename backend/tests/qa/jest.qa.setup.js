const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

process.env.QA_RUN = '1';
