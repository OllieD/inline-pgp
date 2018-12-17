const React = require('react')
const {'default': insertAtCursor} = require('insert-text-at-cursor')

const Textarea = require('./ui/Textarea')
const {'default': Button} = require('./ui/Button')
const {'default': FileInput} = require('./ui/FileInput')
const Grid = require('./ui/Grid')
const toast = require('./ui/Toast')
const EncryptionSettings = require('./EncryptionSettings')
const Keyring = require('../Keyring')
const Settings = require('../Settings')
const EncryptMessage = require('../EncryptMessage')
const wait = require('../utils/wait')
const dataUriRx = require('../utils/dataUriRx')

const keys = () => Keyring.instance()

class ContentEditor extends React.Component {
    constructor() {
        super()
        const signKey = (Settings.getCurrentSignKey() || {}).id
        this.state = {value: '', encryptionKey: (Settings.getCurrentEncryptionKey() || {}).id, signKey, doSign: !!signKey}
    }

    async encrypt(ev) {
        ev.preventDefault()

        const {onSubmit} = this.props
        const {value, encryptionKey, signKey, doSign} = this.state

        this.setState({disabled: true}, async () => {
            await wait()
            try {
                const enc = new EncryptMessage(
                    value,
                    encryptionKey && keys().byId(encryptionKey),
                    doSign && signKey && keys().byId(signKey)
                )
                onSubmit(await enc.perform())
            } catch(err) {
                console.error(err)
                toast(err.message)
            } finally {
                this.setState({disabled: false})
            }
        })

    }

    render() {
        const {value, encryptionKey, signKey, doSign, disabled} = this.state

        return (
            <form onSubmit={this.encrypt.bind(this)} style={{backgroundColor: 'white'}}>
                <Grid n={1} padding={10} style={{width: '100%', height: '100%', padding: '10px', boxSizing: 'border-box'}}>
                    <div style={{height: 'calc(100vh - 130px)'}}>
                        <Textarea
                            ref={ref => {
                                if(ref !== null)
                                    this._text = ref
                            }}
                            focus required
                            wrapperStyle={{height: 'calc(100% - 10px)', marginBottom: '2px'}}
                            style={{width: '100%', resize: 'none', height: '100%'}}
                            value={value}
                            onChange={value => this.setState({value})}
                        />
                        <a><FileInput multiple onUpload={f => {
                            const reader  = new FileReader()
                            reader.readAsDataURL(f)
                            reader.onloadend = () =>
                                insertAtCursor(this._text._ref, ` ${dataUriRx.insertParameter(reader.result, 'filename', f.name)} `)
                        }}>Add files (will be added as data urls)</FileInput></a>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <EncryptionSettings style={{maxWidth: '80%'}} value={{encryptionKey, signKey, doSign}} onChange={v => this.setState(v)}/>
                        <Button loading={disabled} disabled={disabled} primary type={'submit'}>Encrypt</Button>
                    </div>
                </Grid>
            </form>
        )
    }
}

module.exports = ContentEditor
