# BracketBrain - Advanced Bracket Validator

An interactive web application for validating bracket expressions with real-time stack visualization and animated feedback.

## 🚀 Features

- **Real-time Validation**: Instant bracket balance checking
- **Visual Stack Animation**: Step-by-step visualization of the stack algorithm
- **Interactive Interface**: Modern, responsive design with dark/light themes
- **Expression History**: Track and reuse previous expressions
- **Error Highlighting**: Visual indication of syntax errors
- **Smooth Animations**: Beautiful transitions and micro-interactions
- **Mobile Responsive**: Works perfectly on all device sizes

## 🛠️ Technology Stack

### Backend
- **Python 3.8+**: Core programming language
- **Flask 3.0.0**: Web framework

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with glass-morphism effects
- **JavaScript**: Interactive functionality
- **Font Awesome 6.4.0**: Icon library
- **Vanta.js**: Animated background effects
- **Three.js**: 3D graphics for background



### Supported Brackets
- Parentheses: `()`
- Square Brackets: `[]`
- Curly Braces: `{}`

### Example Expressions
- **Valid**: `{[()()]}`, `({[]})`, `[({})]`
- **Invalid**: `{[(])}`, `({[})`, `({)}`

### Features Explained

#### Stack Visualization
- **Push**: When opening bracket is encountered
- **Pop**: When matching closing bracket is found
- **Error**: When mismatch or unexpected bracket occurs

#### History Tracking
- Automatically saves last 15 expressions
- Click any history item to re-run validation
- Persistent storage using localStorage

#### Theme Toggle
- Dark mode (default)
- Light mode
- Theme preference saved automatically


#### Vercel
1. Push to GitHub
2. Import repository in Vercel
3. Deploy automatically

#### PythonAnywhere
1. Upload files to web app
2. Configure virtual environment
3. Set up WSGI file



### Test Cases
| Expression | Expected Result |
|------------|----------------|
| `()`        | Valid |
| `[]`        | Valid |
| `{}`        | Valid |
| `{[()]}`    | Valid |
| `{[(])}`    | Invalid |
| `({[})`     | Invalid |
| `({)}`      | Invalid |




## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow PEP 8 for Python code
- Use semantic HTML5
- Write clean, commented code
- Test thoroughly before submitting


## 👨‍💻 Author

**Yogesh Kadwe**  
CSE Student  

- GitHub: [@Yogesh-kadwe](https://github.com/Yogesh-kadwe)
- Project: [Python-project-BracketBrain](https://github.com/Yogesh-kadwe/Python-project-BracketBrain)

**Made with ❤️ by Yogesh Kadwe**
