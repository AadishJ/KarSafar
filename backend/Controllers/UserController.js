const handleLoginGet = async ( req, res ) => { 

}

const handleLoginPost = async ( req, res ) => { 

}

const handleRegisterPost = async ( req, res ) => { 
    const { name, email, password } = req.body;
    console.log("Registering user:", name, email, password);
}

const handleLogout = async ( req, res ) => { 

}

export { handleLoginGet, handleLoginPost, handleRegisterPost, handleLogout };