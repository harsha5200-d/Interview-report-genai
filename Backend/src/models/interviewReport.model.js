const mongoose = require("mongoose")


/**
 * - job description 
 * - resume text 
 * - self description 
 * - Matchscore : number
 *  
 *  Technical questions : [{
 * questions : "",
 * intention : "",
 * anser : " ".
 * }]
 * 
 * 
 *  Behavorial questions : [
 * question : " ",
 * intention : "",
 * answer : ""
 * ]
 * 
 *  skills gaps : [{
 * skill : " ",
 * severity :{
 * type : String,
 * enum : ["low", "medium ","high "]}
 * }]
 *  prepataion plan : [{
 * day : NUmber,
 * focus : String,
 * task : {String}}]
 *  
 */

const technicalQuestionSchema = new mongoose.Schema({
    question:{
        type: String,
        required:[true, "Technical question is required"]
    },
    intention:{
        type: String,
        required:[true, "Intention is required"]
    },
    answer:{
        type: String,
        required:[true, "Answer is required"]
    }
},{
    _id: false
})

const skillGapSchema = new mongoose.Schema({
    skill:{
        type: String,       
        required:[true, "Skill is required"]
    },
    severity:{
        type : String,
        enum : ["low", "medium", "high"],
        set: v => typeof v === 'string' ? v.trim() : v,
        required:[true, "Severity is required"] 
    }
},{
    _id: false
})  

const preparationPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: [true, "Day is required"]
    },

    tasks: [
        {
            type: String,
            required: true
        }
    ]

}, {
    _id: false
});

const behavioralQuestionSchema = new mongoose.Schema({
    question:{
        type: String,
        required:[true, "Behavioral question is required"]
    },
    intention:{
        type: String,
        required:[true, "Intention is required"]
    },
    answer:{
        type: String,
        required:[true, "Answer is required"]
    }
},{
    _id: false
})

const interviewPreparation = new mongoose.Schema({

    jobDescription: {
        type: String,
        required: [true, "Job description is required"]
    },
    resume: {
        type: String,
    },
    selfDescription:{
        type: String,
    },
    matchScore: {
        type: Number,
        min:0,
        max:100,
    },
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillGaps: [skillGapSchema],
    preparationPlan: [preparationPlanSchema],
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref : "users",
    }
},{
    timestamps: true    

})

const InterviewReport = mongoose.model("InterviewReport", interviewPreparation)

module.exports = InterviewReport    