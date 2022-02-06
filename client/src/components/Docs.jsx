import React, { Component } from 'react'
import axios, {base} from '../axios-cls'
import Tooltip from '@material-ui/core/Tooltip';
import { Modal } from 'react-bootstrap'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import Snackbar from '@material-ui/core/Snackbar';
import Cookie from 'js-cookie'

//global worker to load pdf (if using react-pdf )
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
class Docs extends Component {

    state = {
        Docs: [],
        numPages: null, 
        pageOpacity : 1,
        snackBarPosition : {
            vertical : "top",
            horizontal : "center"
        },
        copySuccess : false,
        modal : false,
        copyMessageState : false,
        docPreview : false,
        bodyscroll : "scroll",
        docName : "",
        docType:"",
        docContent:[],
        docPath:"",
        pageNumber: 1,
        data : {
            saedocs : null,
            filename:""
        },
        copyClipBoardStatus:false,
        docUploadSuccess : false
    }

    snackPosition = this.state.snackBarPosition

    componentDidMount = async() => {
        document.addEventListener('click', this.handleClickOutsideModal, true);
        const { data : Docs } = await axios.get('/upload-doc/g/' + this.props.user.data._id)
        console.log(Docs)
        this.setState({ Docs })
    }

    componentWillUnmount = () => {
        document.removeEventListener('click', this.handleClickOutsideModal, true);
    }

    handleChange = async({currentTarget:input}) => {
        const data = {...this.state.data};
        data[input.name] = input.files[0]
        data["filename"] = input.files[0].name
        this.setState({ data })
    }

    //uploading doc
    handleSubmit = async e => {
        e.preventDefault()
        const payload  = new FormData()
        payload.append('saedocs', this.state.data.saedocs)

        const config = { headers: { 'content-type': 'multipart/form-data' } }

        const { data:res } = await axios.post(`/upload-doc/${this.props.user.data._id}`, payload, config)  
        if (res.length != 0) this.setState({ docUploadSuccess : true, data : { saedocs : null, filename : "" } })     
    }

    //table headers
    headings = [ "name", "created at" ]
    
    //open current pdf
      openPdf = async(e, name, path) => {
        const type = name.split('.')[1]
        if (type === "txt") {
            const { data:docContent } = await axios.get(`${path}`)
            const newContent = docContent.split(';')
            this.setState({ docType:'txt', docContent:newContent })
        }
        else {
            this.setState({ docType:"pdf" })
        }
            
        this.setState({ docName:name, docPath:path, modal:false, docPreview:true, bodyscroll:"hidden" })
      }

    //download request
    downloadThisFile = async(e, filename) => {
        const {data:res} = await axios.get(`download/${this.state.docPath}`)
        console.log(base + `download/${this.state.docPath}`)
        console.log(res)
    }

    modalRef = React.createRef()
    openModal = () => {
        this.setState({ modal : false, showBanner:true, docPreview:true })
    }
    handleClickOutsideModal = e => {

        {/*If clicked outside of modal, it will close*/}
        if (this.modalRef.current && !this.modalRef.current.contains(e.target)) {
           this.setState({docPreview : false})
        }
    };

    copyTextToClipBoard = () => {
        navigator.clipboard.writeText(base + this.state.docPath)
        this.setState({ copyClipBoardStatus : true })
        this.copyMessage()
    }


    doc = styled.div`
        position : fixed;
        box-shadow: #00799F 0px 5px 15px;
        top:1.3rem;
        bottom:0;
        left:0;
        right:0;
        width:70%;
        background-color:#fff;
        z-index:3;
        // overflow:scroll;
        margin : 0 auto;
        height:100vh;

        ::-webkit-scrollbar {
            overflow-y: auto; 
            width: 14px;
            z-index: 1000;
            height: 10px; 
            background-color: rgb(211, 211, 211);
        }
        
        ::-webkit-scrollbar-thumb {
          overflow: overlay;
            background:rgba(#a3a3a3, 1); 
            border-radius: 0px;
            border-radius: 0rem;
        }
          
        ::-webkit-scrollbar-thumb:hover {
          overflow: overlay;
          background:rgba(#a3a3a3, 1); 
        }

        @media (max-width:808px) {
            width:90%;
        }
    `
    copyMessage = () => {
        this.setState({ copyMessageState:true })
    }
    copyMessageColse = () => {
        this.setState({ copyMessageState:false })
    }

    render() {
        
        // document.body.style.overflow = this.state.bodyscroll
        const { docPath, docName, docType } = this.state;
        const Docs = this.state.Docs === undefined ? null : this.state.Docs
        return (
            <motion.div initial={{y:-25}} animate={{y:0}} transition={{ type: "spring", stiffness: 160 }} className="container p-0">
                <Snackbar 
                open={this.state.copyMessageState} 
                autoHideDuration={3000} 
                anchorOrigin={{ vertical:this.snackPosition.vertical, horizontal:this.snackPosition.horizontal }}
                key={this.snackPosition.vertical + this.snackPosition.horizontal}
                onClose={this.copyMessageColse}>
                    <p onClose={this.handleClose} style={{ backgroundColor:"#FFF8BE", color:"#444", padding:"0.2rem", borderRadius:"0.1rem" }}>
                    file url copied!!
                    </p>
                </Snackbar>
                <Snackbar 
                open={this.state.docUploadSuccess} 
                autoHideDuration={3000} 
                anchorOrigin={{ vertical:this.snackPosition.vertical, horizontal:this.snackPosition.horizontal }}
                key={this.snackPosition.vertical + this.snackPosition.horizontal}
                onClose={this.copyMessageColse}>
                    <p onClose={this.handleClose} style={{ backgroundColor:"#FFF8BE", color:"#444", padding:"0.2rem", borderRadius:"0.1rem" }}>
                    file uploaded!!
                    </p>
                </Snackbar>
                <div className="container position-relative">
                    {this.state.docPreview &&<this.doc ref={this.modalRef} className="docs-preview-modal">
                    <div className="preview-pdf-file">
                    <div className="d-p-n">
                        <a className="" href={base + `download/` + docPath }>
                            <button onClick={e => this.downloadThisFile(e, docName)}>Download</button>
                        </a>
                        <a target="_blank" href={base + docPath }>
                            <button>Open in new tab</button>
                        </a>
                        <Tooltip title="copy file url" placement="bottom">
                            <button onClick={() => this.copyTextToClipBoard()}>
                                <i className="fa fa-copy" />
                            </button>
                        </Tooltip>
                        <i  className="fa fa-times" onClick={() => this.setState({ docPreview : false })}/>
                    </div>
                    { docType != "txt" && <iframe style={{width:"100%", height:"100vh"}} src={base + docPath} frameborder="0"/>}
                </div>
                {docType === "txt" && 
                    <div className="preview-txt-files">
                        {this.state.docContent.map(str => 
                            <p id="p-t-f" style={{ whiteSpace:"pre-wrap", margin:"0", fontFamily:'Roboto Mono' }}>{str}</p>
                            )}
                    </div>
                }   
                    </this.doc>}
                </div>
                <div className="col-md-8 mx-auto mt-3 p-0">
                    <div className="add-docs p-0">
                        <label className="docs-label" htmlFor="saedocs"><span>Upload file</span></label>
                        <Tooltip title="upload file"><i onClick={this.handleSubmit} className="fa fa-arrow-right" /></Tooltip>
                        <input className="docs-input" type="file" name="saedocs" id="saedocs" onChange={this.handleChange}/> 
                    </div>
                    <p style={{color:"#d5d5d5", fontFamily:"roboto", fontSize:"14px"}}>{this.state.data.filename}</p>
                </div>

                <table className="docs-table table-component table mx-auto col-md-8">
                    <thead>
                        <tr>
                            {this.headings.map(m => 
                                <th style={{ position:"sticky", top:"0px", border:"2px solid #1D2527", borderBottom:"0" }}>{m}</th>    
                            )}  
                        </tr>
                    </thead>
                    <tbody>
                        {Docs.map((m, key) => 
                            <Tooltip title={m.name} placement="left-start" open={false}>
                                <tr name={key} key={key} id={key} onClick={e => this.openPdf(e, m.name, m.slug)}>
                                    <td>{m.name}</td>
                                    <td>{m.created_at}</td>
                                </tr>   
                            </Tooltip> 
                        )}
                    </tbody>
                </table>
                    
                <div>
                </div>


                

            </motion.div>
        );
    }
}

export default Docs;