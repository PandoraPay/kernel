module.exports ={

    address: "127.0.0.1",
    port: 6379,

    /**
     * Select which Redis DB should be used
     */
    db: 0,

    differentDatabase: false,

    /**
     * Credentials. BE AWARE TO FIREWALL YOUR REDIS DATABASE. BLOCK ANY INCOMING CONNECTIONS TO YOUR REDIS DATABASE.
     */
    user: "",
    password: ""

}