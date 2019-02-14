const truffleContract = require('truffle-contract')
const ipfs = require('ipfs-api')("localhost", '5001', {protocol: 'http'})

const merkleRoot = require('./merkleRoot')

async function addIPFSFile(tbFileSystem, account, name, buf) {

    let ipfsFile = (await ipfs.files.add([{content: buf, path: name}]))[0]

    let ipfsHash = ipfsFile.hash
    let size = buf.length
	// let name = ipfsFile.path
	console.log("added to ipfs", ipfsFile, buf)

    //setup file
    let fileNonce = Math.floor(Math.random()*Math.pow(2, 30))
    let mr = merkleRoot(x => window.web3.sha3(x, {encoding:"hex"}), buf)
    console.log("with root", mr)

    let fileID = await tbFileSystem.calcId.call(fileNonce, {from: account})

    await tbFileSystem.addIPFSFile(name, size, ipfsHash, mr, fileNonce, {from: account, gas: 300000})
    
    console.log("Uploaded file", name, "with root", mr)

    return fileID
}

function showResult(hash) {
    return "<div>Output from TrueBit solver:</div> <div>" + hash + "</div>"
}

var fileSystem, sampleSubmitter, account

function getTruebitResult(data) {

    sampleSubmitter.debugData.call(data, {gas: 2000000, from: account}).then(function(res) {
      console.log("Debug data:", res)
    })

    return sampleSubmitter.submitData(data, {gas: 2000000, from: account}).then(function(txHash) {

	const gotFilesEvent = sampleSubmitter.GotFiles()

	return new Promise((resolve, reject) => {
	    gotFilesEvent.watch(function(err, result) {
		if (result) {
		    gotFilesEvent.stopWatching(x => {})
		    resolve(result.args.files[0])
		} else if(err) {
		    reject()
		}
	    })
	})
    }).then(function(fileID) {
	return fileSystem.getData.call(fileID)
    }).then(function(lst) {
	return lst[0]
    })

}

window.runSample = function () {
    data = document.getElementById('input-data').value
    // hash = calcScrypt(data)
    // document.getElementById('js-scrypt').innerHTML = showJSScrypt("0x" + s.to_hex(hash))

    getTruebitResult(data).then(function(truHash) {
	document.getElementById('tb-result').innerHTML = showResult(truHash)
    })
}

async function testIPFS() {
	addIPFSFile(fileSystem, account, "test.data", new Buffer("asd"))
}

function getArtifacts(networkName) {
    httpRequest = new XMLHttpRequest()

    httpRequest.onreadystatechange = async function() {
	if (httpRequest.readyState === XMLHttpRequest.DONE) {
	    //get scrypt submitter artifact
	    const artifacts = JSON.parse(httpRequest.responseText)

	    fileSystem = truffleContract({
		abi: artifacts.fileSystem.abi,
	    })

	    fileSystem.setProvider(window.web3.currentProvider)

	    fileSystem = await fileSystem.at(artifacts.fileSystem.address)

	    sampleSubmitter = truffleContract({
		abi: artifacts.sample.abi
	    })

	    sampleSubmitter.setProvider(window.web3.currentProvider)

	    sampleSubmitter = await sampleSubmitter.at(artifacts.sample.address)

		account = window.web3.eth.defaultAccount
		
		testIPFS()
	}
    }

    httpRequest.open('GET', networkName + '.json')
    httpRequest.send()
}


function init() {
    const isMetaMaskEnabled = function() { return !!window.web3 }

    if (!isMetaMaskEnabled()) {
	document.getElementById('app').innerHTML = "Please install MetaMask"
    } else {

	//alert(networkType)
	window.web3.version.getNetwork((err, netId) => {
	    if(netId == '1') {
		getArtifacts('main')
	    } else if(netId == '3') {
		getArtifacts('ropsten')
	    } else if(netId == '4') {
		getArtifacts('rinkeby')
	    } else if(netId == '42') {
		getArtifacts('kovan')
	    } else {
		getArtifacts('private')
	    }
	})
    }
}

window.onload = init
