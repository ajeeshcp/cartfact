const {MongoClient} = require("mongodb") ;

const state = {
    db: null
}

const connect = (done) => {

    const url = "mongodb://localhost:27017/";
    const dbname = "cartfact"

    MongoClient.connect( url , (err, data) => {
        if (err) return done(err) ;
        state.db = data.db(dbname) ;
        done() ;
    })

    

}

const get = () => {
    return state.db
}

module.exports = { 
    connect,
    get
}